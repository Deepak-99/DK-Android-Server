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
  if (Object.keys(req.body || {}).length > 0) logger.debug('Request body:', JSON.stringify(req.body, null, 2));
  next();
});

// Admin login
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
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    if (user.isLocked && typeof user.isLocked === 'function' && user.isLocked()) {
      return res.status(423).json({ success: false, error: 'Account temporarily locked due to too many failed attempts' });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      if (typeof user.incrementLoginAttempts === 'function') await user.incrementLoginAttempts();
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    if (typeof user.resetLoginAttempts === 'function') await user.resetLoginAttempts();
    await user.update({ last_login: new Date() });

    const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '24h' });

    logger.info(`Admin login successful: ${user.email}`);

    // Return token at top-level (AdminPanel expects data.token)
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

// Device registration/authentication
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

    // Check if device already exists
    let device = await Device.findOne({ where: { device_id } });

    if (device) {
      // Update existing device
      await device.update({
        device_name,
        model,
        manufacturer,
        android_version,
        api_level,
        imei,
        phone_number,
        fcm_token,
        app_version,
        status: 'online',
        last_seen: new Date(),
        ip_address: req.ip
      });
    } else {
      // Create new device
      device = await Device.create({
        device_id,
        device_name,
        model,
        manufacturer,
        android_version,
        api_level,
        imei,
        phone_number,
        fcm_token,
        app_version,
        status: 'online',
        last_seen: new Date(),
        ip_address: req.ip
      });
    }

    const deviceToken = jwt.sign({ deviceId: device_id, deviceUuid: device.id }, process.env.JWT_SECRET, { expiresIn: '30d' });

    logger.info(`Device registered/updated: ${device_id}`);

    // ---------- NORMALIZE DEVICE PAYLOAD FOR EMIT ----------
    const devicePlain = device.get ? device.get({ plain: true }) : device;
    const emittedDevice = {
      ...devicePlain,
      // camelCase aliases
      deviceId: devicePlain.deviceId || devicePlain.device_id || devicePlain.deviceId,
      name: devicePlain.name || devicePlain.device_name || devicePlain.deviceName || null,
      lastSeen: devicePlain.lastSeen || devicePlain.last_seen || null,
      // legacy snake_case aliases
      device_id: devicePlain.device_id || devicePlain.deviceId || null,
      device_name: devicePlain.device_name || devicePlain.name || null,
      last_seen: devicePlain.last_seen || devicePlain.lastSeen || null
    };
    // -------------------------------------------------------

    // Emit to admin room (if io is attached)
    if (req.io) {
      try {
        req.io.to('admin-room').emit('device-registered', { device: emittedDevice });
      } catch (emitErr) {
        logger.warn('Emit failed for device-registered:', emitErr);
      }
    }

    // Respond with both camelCase and snake_case for compatibility
    res.json({
      success: true,
      device_token: deviceToken,
      device: {
        id: devicePlain.id,
        deviceId: emittedDevice.deviceId,
        device_id: emittedDevice.device_id,
        name: emittedDevice.name || null,
        device_name: emittedDevice.device_name || null,
        status: devicePlain.status || 'online',
        lastSeen: emittedDevice.lastSeen
      }
    });
  } catch (error) {
    logger.error('Device registration error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Device heartbeat
router.post('/device/heartbeat', async (req, res) => {
  // authenticateDevice middleware is optional in your project; if present replace this line accordingly
  try {
    const deviceIdFromReq = req.body.device_id || req.body.deviceId || req.headers['x-device-id'] || null;
    if (!deviceIdFromReq) {
      return res.status(400).json({ success: false, error: 'Device ID required' });
    }

    const device = await Device.findOne({ where: { device_id: deviceIdFromReq } });
    if (!device) {
      return res.status(404).json({ success: false, error: 'Device not found' });
    }

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

    // Emit normalized heartbeat
    const devicePlain = device.get ? device.get({ plain: true }) : device;
    const emittedHeartbeat = {
      deviceId: devicePlain.deviceId || devicePlain.device_id,
      device_id: devicePlain.device_id || devicePlain.deviceId,
      status: 'online',
      lastSeen: devicePlain.lastSeen || devicePlain.last_seen || new Date()
    };

    if (req.io) {
      try {
        req.io.to('admin-room').emit('device-heartbeat', emittedHeartbeat);
      } catch (emitErr) {
        logger.warn('Emit failed for device-heartbeat:', emitErr);
      }
    }

    res.json({ success: true, message: 'Heartbeat received' });
  } catch (error) {
    logger.error('Device heartbeat error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Refresh token
router.post('/refresh', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '24h' });
    res.json({ success: true, token });
  } catch (error) {
    logger.error('Token refresh error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Verify session/token (POST - existing)
router.post('/verify', authenticateToken, async (req, res) => {
  try {
    res.json({
      success: true,
      valid: true,
      user: { id: req.user.id, username: req.user.username, email: req.user.email, role: req.user.role }
    });
  } catch (error) {
    logger.error('Token verification error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Verify session/token (GET - added for frontend convenience)
router.get('/verify', authenticateToken, async (req, res) => {
  try {
    res.json({
      success: true,
      valid: true,
      user: { id: req.user.id, username: req.user.username, email: req.user.email, role: req.user.role }
    });
  } catch (error) {
    logger.error('Token verification (GET) error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Logout
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
