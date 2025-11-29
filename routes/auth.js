const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { User, Device } = require('../config/database');
const { authenticateToken, authenticateDevice } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Parse JSON bodies for auth routes
router.use(express.json({ limit: '10mb' }));
router.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Log all auth requests
router.use((req, res, next) => {
  logger.info(`Auth request: ${req.method} ${req.originalUrl}`);
  if (Object.keys(req.body || {}).length > 0)
    logger.debug('Request body:', JSON.stringify(req.body, null, 2));
  next();
});

/* =============================
   ADMIN LOGIN
============================= */
router.post('/admin/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 })
], async (req, res) => {
  const requestId = req.requestId || 'unknown';
  logger.info(`[${requestId}] Login attempt for email: ${req.body.email}`);

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn(`[${requestId}] Validation failed:`, errors.array());
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password } = req.body;
    const user = await User.findOne({ where: { email, role: 'admin' } });
    if (!user) return res.status(401).json({ success: false, error: 'Invalid credentials' });

    if (user.isLocked && typeof user.isLocked === 'function' && user.isLocked()) {
      return res.status(423).json({ success: false, error: 'Account temporarily locked due to too many failed attempts' });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      if (typeof user.incrementLoginAttempts === 'function')
        await user.incrementLoginAttempts();
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    if (typeof user.resetLoginAttempts === 'function')
      await user.resetLoginAttempts();

    await user.update({ last_login: new Date() });

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    logger.info(`Admin login successful: ${user.email}`);

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
  } catch (error) {
    logger.error('Admin login error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

/* =============================
   DEVICE REGISTRATION
============================= */
router.post('/device/register', [
  body('device_id').notEmpty(),
  body('device_name').notEmpty(),
  body('fcm_token').optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

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

    // Find device using correct DB field: deviceId
    let device = await Device.findOne({ where: { deviceId: device_id } });

    if (device) {
      await device.update({
        name: device_name,
        model,
        manufacturer,
        osVersion: android_version,
        apiLevel: api_level,
        imei,
        phoneNumber: phone_number,
        fcm_token,
        appVersion: app_version,
        isOnline: true,
        lastSeen: new Date(),
        ipAddress: req.ip
      });
    } else {
      device = await Device.create({
        deviceId: device_id,
        name: device_name,
        model,
        manufacturer,
        osVersion: android_version,
        apiLevel: api_level,
        imei,
        phoneNumber: phone_number,
        fcm_token,
        appVersion: app_version,
        isOnline: true,
        lastSeen: new Date(),
        ipAddress: req.ip
      });
    }

    const deviceToken = jwt.sign(
      { deviceId: device_id, deviceUuid: device.id },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    logger.info(`Device registered/updated: ${device_id}`);

    const devicePlain = device.get({ plain: true });

    const emittedDevice = {
      ...devicePlain,
      deviceId: devicePlain.deviceId,
      name: devicePlain.name,
      lastSeen: devicePlain.lastSeen
    };

    if (req.io) {
      req.io.to('admin-room').emit('device-registered', { device: emittedDevice });
    }

    res.json({
      success: true,
      device_token: deviceToken,
      device: {
        id: devicePlain.id,
        deviceId: devicePlain.deviceId,
        name: devicePlain.name,
        status: devicePlain.isOnline ? 'online' : 'offline',
        lastSeen: devicePlain.lastSeen
      }
    });
  } catch (error) {
    logger.error('Device registration error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

/* =============================
   DEVICE HEARTBEAT
============================= */
router.post('/device/heartbeat', async (req, res) => {
  try {
    const deviceIdFromReq =
      req.body.device_id ||
      req.body.deviceId ||
      req.headers['x-device-id'];

    if (!deviceIdFromReq)
      return res.status(400).json({ success: false, error: 'Device ID required' });

    const device = await Device.findOne({ where: { deviceId: deviceIdFromReq } });
    if (!device)
      return res.status(404).json({ success: false, error: 'Device not found' });

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

    await device.update({
      batteryLevel: battery_level,
      isCharging: is_charging,
      networkType: network_type,
      locationEnabled: location_enabled,
      cameraEnabled: camera_enabled,
      microphoneEnabled: microphone_enabled,
      storageTotal: storage_total,
      storageAvailable: storage_available,
      ramTotal: ram_total,
      ramAvailable: ram_available,
      isOnline: true,
      lastSeen: new Date(),
      ipAddress: req.ip
    });

    const devicePlain = device.get({ plain: true });

    const emittedHeartbeat = {
      deviceId: devicePlain.deviceId,
      status: 'online',
      lastSeen: devicePlain.lastSeen
    };

    if (req.io) {
      req.io.to('admin-room').emit('device-heartbeat', emittedHeartbeat);
    }

    res.json({ success: true, message: 'Heartbeat received' });
  } catch (error) {
    logger.error('Device heartbeat error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

/* =============================
   TOKEN REFRESH
============================= */
router.post('/refresh', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );
    res.json({ success: true, token });
  } catch (error) {
    logger.error('Token refresh error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

/* =============================
   TOKEN VERIFY
============================= */
router.post('/verify', authenticateToken, async (req, res) => {
  try {
    res.json({
      success: true,
      valid: true,
      user: {
        id: req.user.id,
        username: req.user.username,
        email: req.user.email,
        role: req.user.role
      }
    });
  } catch (error) {
    logger.error('Token verification error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

router.get('/verify', authenticateToken, async (req, res) => {
  try {
    res.json({
      success: true,
      valid: true,
      user: {
        id: req.user.id,
        username: req.user.username,
        email: req.user.email,
        role: req.user.role
      }
    });
  } catch (error) {
    logger.error('Token verification (GET) error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

/* =============================
   LOGOUT
============================= */
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    logger.info(`User logged out: ${req.user?.email}`);
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router;
