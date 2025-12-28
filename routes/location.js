const express = require('express');
const { Op } = require('sequelize');
const { Device, Location } = require('../config/database');
const { authenticateToken, authenticateDevice, requireAdmin } = require('../middleware/auth');
const logger = require('../utils/logger');
const eventBus = require('../eventBus');

const router = express.Router();

// Submit location data (Device endpoint)
router.post('/', authenticateDevice, async (req, res) => {
  try {
    const device = await Device.findOne({ where: { device_id: req.deviceId } });
    if (!device) {
      return res.status(404).json({
        success: false,
        error: 'Device not found'
      });
    }

    const {
      latitude,
      longitude,
      altitude,
      accuracy,
      speed,
      bearing,
      provider,
      address,
      timestamp,
      battery_level,
      network_type,
      is_mock
    } = req.body;

    const location = await Location.create({
      device_id: device.id,
      latitude,
      longitude,
      altitude,
      accuracy,
      speed,
      bearing,
      provider,
      address,
      timestamp: timestamp ? new Date(timestamp) : new Date(),
      battery_level,
      network_type,
      is_mock: is_mock || false
    });

    logger.info(`Location data received from device: ${req.deviceId}`);

      eventBus.emit(`location:${req.deviceId}`, {
          device_id: req.deviceId,
          ...location.toJSON()
      });

    // Emit to admin room
    if (req.io) {
      req.io.to('admin-room').emit('location-update', {
        device_id: req.deviceId,
        location: location.toJSON()
      });
    }

    res.json({
      success: true,
      message: 'Location data saved successfully',
      data: { location_id: location.id }
    });
  } catch (error) {
    logger.error('Submit location error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Submit bulk location data (Device endpoint)
router.post('/bulk', authenticateDevice, async (req, res) => {
  try {
    const device = await Device.findOne({ where: { device_id: req.deviceId } });
    if (!device) {
      return res.status(404).json({
        success: false,
        error: 'Device not found'
      });
    }

    const { locations } = req.body;
    if (!Array.isArray(locations) || locations.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid locations data'
      });
    }

    const locationData = locations.map(loc => ({
      device_id: device.id,
      latitude: loc.latitude,
      longitude: loc.longitude,
      altitude: loc.altitude,
      accuracy: loc.accuracy,
      speed: loc.speed,
      bearing: loc.bearing,
      provider: loc.provider,
      address: loc.address,
      timestamp: loc.timestamp ? new Date(loc.timestamp) : new Date(),
      battery_level: loc.battery_level,
      network_type: loc.network_type,
      is_mock: loc.is_mock || false
    }));

    const createdLocations = await Location.bulkCreate(locationData);

    logger.info(`Bulk location data received from device: ${req.deviceId}, count: ${locations.length}`);

      const latest = createdLocations[createdLocations.length - 1];
      if (latest) {
          eventBus.emit(`location:${req.deviceId}`, {
              device_id: req.deviceId,
              ...latest.toJSON()
          });
      }

    // Emit to admin room
    if (req.io) {
      req.io.to('admin-room').emit('bulk-location-update', {
        device_id: req.deviceId,
        count: locations.length,
        latest_location: createdLocations[createdLocations.length - 1]?.toJSON()
      });
    }

    res.json({
      success: true,
      message: `${locations.length} location records saved successfully`,
      data: { count: createdLocations.length }
    });
  } catch (error) {
    logger.error('Submit bulk location error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Get device locations (Admin only)
router.get('/device/:deviceId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50, from, to } = req.query;
    const offset = (page - 1) * limit;

    const device = await Device.findByPk(req.params.deviceId);
    if (!device) {
      return res.status(404).json({
        success: false,
        error: 'Device not found'
      });
    }

    const whereClause = { device_id: device.id };
    
    if (from || to) {
      whereClause.timestamp = {};
      if (from) whereClause.timestamp[Op.gte] = new Date(from);
      if (to) whereClause.timestamp[Op.lte] = new Date(to);
    }

    const { count, rows: locations } = await Location.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['timestamp', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        locations,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(count / limit),
          total_count: count,
          per_page: parseInt(limit)
        }
      }
    });
  } catch (error) {
    logger.error('Get device locations error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Get location history for map view (Admin only)
router.get('/device/:deviceId/track', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { from, to, limit = 1000 } = req.query;

    const device = await Device.findByPk(req.params.deviceId);
    if (!device) {
      return res.status(404).json({
        success: false,
        error: 'Device not found'
      });
    }

    const whereClause = { device_id: device.id };
    
    if (from || to) {
      whereClause.timestamp = {};
      if (from) whereClause.timestamp[Op.gte] = new Date(from);
      if (to) whereClause.timestamp[Op.lte] = new Date(to);
    }

    const locations = await Location.findAll({
      where: whereClause,
      attributes: ['latitude', 'longitude', 'timestamp', 'accuracy', 'speed'],
      limit: parseInt(limit),
      order: [['timestamp', 'ASC']]
    });

    res.json({
      success: true,
      data: {
        track: locations,
        device: {
          id: device.id,
          device_id: device.device_id,
          device_name: device.device_name
        }
      }
    });
  } catch (error) {
    logger.error('Get location track error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Get latest location for device (Admin only)
router.get('/device/:deviceId/latest', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const device = await Device.findByPk(req.params.deviceId);
    if (!device) {
      return res.status(404).json({
        success: false,
        error: 'Device not found'
      });
    }

    const location = await Location.findOne({
      where: { device_id: device.id },
      order: [['timestamp', 'DESC']]
    });

    res.json({
      success: true,
      data: { location }
    });
  } catch (error) {
    logger.error('Get latest location error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Get all devices latest locations (Admin only)
router.get('/latest', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const devices = await Device.findAll({
      where: { status: 'online' },
      include: [
        {
          model: Location,
          as: 'locations',
          limit: 1,
          order: [['timestamp', 'DESC']]
        }
      ]
    });

    const devicesWithLocation = devices
      .filter(device => device.locations && device.locations.length > 0)
      .map(device => ({
        device: {
          id: device.id,
          device_id: device.device_id,
          device_name: device.device_name,
          status: device.status,
          last_seen: device.last_seen
        },
        location: device.locations[0]
      }));

    res.json({
      success: true,
      data: { devices: devicesWithLocation }
    });
  } catch (error) {
    logger.error('Get all latest locations error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Delete location data (Admin only)
router.delete('/device/:deviceId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { from, to } = req.query;

    const device = await Device.findByPk(req.params.deviceId);
    if (!device) {
      return res.status(404).json({
        success: false,
        error: 'Device not found'
      });
    }

    const whereClause = { device_id: device.id };
    
    if (from || to) {
      whereClause.timestamp = {};
      if (from) whereClause.timestamp[Op.gte] = new Date(from);
      if (to) whereClause.timestamp[Op.lte] = new Date(to);
    }

    const deletedCount = await Location.destroy({ where: whereClause });

    logger.info(`Location data deleted for device: ${device.device_id}, count: ${deletedCount}`);

    res.json({
      success: true,
      message: `${deletedCount} location records deleted successfully`
    });
  } catch (error) {
    logger.error('Delete location data error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

module.exports = router;
