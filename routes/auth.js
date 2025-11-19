const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { User, Device } = require('../config/database');
const { authenticateToken, authenticateDevice } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();
router.use(express.json({ limit: '10mb' }));
router.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Admin login
router.post('/admin/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const { email, password } = req.body;
    const user = await User.findOne({ where: { email, role: 'admin' } });
    if (!user) return res.status(401).json({ success: false, error: 'Invalid credentials' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      await user.incrementLoginAttempts();
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    await user.resetLoginAttempts();
    await user.update({ last_login: new Date() });

    const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '24h' });

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        last_login: user.last_login
      }
    });
  } catch (err) {
    logger.error('Admin login error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Device registration
router.post('/device/register', [
  body('device_id').notEmpty(),
  body('device_name').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const {
      device_id,
      device_name,
      model,
      manufacturer,
      android_version,
      api_level,
      imei,
      phone_number,
      fcm_token,
      app_version
    } = req.body;

    // Check if device already exists
    let device = await Device.findOne({ where: { device_id } });

    const updates = {
      device_name,
      model,
      manufacturer,
      android_version,
      imei,
      phone_number,
      api_level,
      fcm_token,
      app_version,
      status: 'online',
      last_seen: new Date(),
      ip_address: req.ip
    };

    if (device) {
      await device.update(updates);
    } else {
      device = await Device.create({ device_id, ...updates });
    }

    const deviceToken = jwt.sign({ deviceId: device.device_id || device_id, deviceUuid: device.id }, process.env.JWT_SECRET, { expiresIn: '30d' });

    // normalize payload for admin clients
    const normalized = {
      id: device.id,
      deviceId: device.device_id || device.deviceId || device_id,
      name: device.device_name || device.name,
      nickname: device.nickname || null,
      status: device.status || 'online',
      lastSeen: device.last_seen || device.lastSeen || new Date(),
      model: device.model,
      manufacturer: device.manufacturer,
      ipAddress: device.ip_address || req.ip
    };

    // Emit to admin-room if available
    const io = req.app.get('io');
    if (io) {
      // send to 'admin' room (AdminPanel client joins 'admin' on connect)
      io.to('admin').emit('device-registered', { device: normalized });
    }

    logger.info(`Device registered/updated: ${device.device_id || device_id}`);

    res.json({
      success: true,
      device_token: deviceToken,
      device: normalized
    });
  } catch (err) {
    logger.error('Device registration error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Device heartbeat
router.post('/device/heartbeat', authenticateDevice, async (req, res) => {
  try {
    const {
      battery_level,
      is_charging,
      network_type,
      location_enabled,
      camera_enabled,
      microphone_enabled,
      storage_total,
      storage_available,
      ram_total,
      ram_available
    } = req.body;

    const device = await Device.findOne({ where: { device_id: req.deviceId } });
    if (!device) return res.status(404).json({ success: false, error: 'Device not found' });

    await device.update({
      battery_level,
      is_charging,
      network_type,
      location_enabled,
      camera_enabled,
      microphone_enabled,
      storage_total,
      storage_available,
      ram_total,
      ram_available,
      status: 'online',
      last_seen: new Date(),
      ip_address: req.ip
    });

    // normalized payload
    const normalized = {
      id: device.id,
      deviceId: device.device_id,
      status: 'online',
      lastSeen: device.last_seen,
      batteryLevel: battery_level,
      isCharging: !!is_charging
    };

    const io = req.app.get('io');
    if (io) {
      io.to('admin').emit('device-heartbeat', normalized);
    }

    res.json({ success: true, message: 'Heartbeat received', data: normalized });

  } catch (err) {
    logger.error('Device heartbeat error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// token refresh, verify, logout - keep behavior
router.post('/refresh', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '24h' });
    res.json({ success: true, token });
  } catch (err) {
    logger.error('Token refresh error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

router.post('/verify', authenticateToken, async (req, res) => {
  try {
    res.json({ success: true, valid: true, user: { id: req.user.id, username: req.user.username, email: req.user.email, role: req.user.role } });
  } catch (err) {
    logger.error('Token verify error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

router.post('/logout', authenticateToken, async (req, res) => {
  try {
    logger.info(`User logged out: ${req.user.email}`);
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    logger.error('Logout error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router;
