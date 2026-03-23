'use strict';

console.log("[AUTH ROUTE] File loading...");

const express = require('express');
console.log("[AUTH ROUTE] express loaded");

const jwt = require('jsonwebtoken');
console.log("[AUTH ROUTE] jwt loaded");

const { body, validationResult } = require('express-validator');
console.log("[AUTH ROUTE] express-validator loaded");

/*
  IMPORTANT: use shared models
*/
const db = require('../models');
console.log("[AUTH ROUTE] shared models loaded");

const { User, Device } = db;
console.log("[AUTH ROUTE] User & Device models ready");

const auth = require('../middleware/auth');
console.log("[AUTH ROUTE] auth middleware loaded");

const { authenticateToken, authenticateDevice } = auth;

const logger = require('../utils/logger');
console.log("[AUTH ROUTE] logger loaded");

const router = express.Router();
console.log("[AUTH ROUTE] router created");

const authController = require('../controllers/authController');
console.log("[AUTH ROUTE] authController loaded");

console.log("[AUTH ROUTE] All modules loaded");

/* =============================
   MIDDLEWARE
============================= */

// Parse JSON bodies for auth routes
router.use(express.json({ limit: '10mb' }));
router.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Log all auth requests
router.use((req, res, next) => {
  logger.info(`Auth request: ${req.method} ${req.originalUrl}`);
  if (Object.keys(req.body || {}).length > 0) {
    logger.debug('Request body:', JSON.stringify(req.body, null, 2));
  }
  next();
});

/* =============================
   ✅ LOGIN (SINGLE ENTRY POINT)
============================= */

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password required')
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: errors.array()[0].msg
        });
      }

      // 👉 Delegate to controller
      return authController.login(req, res);

    } catch (error) {
      logger.error('Login route error:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }
);

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
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg
      });
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

    let device = await Device.findOne({
      where: { deviceId: device_id }
    });

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

    logger.info(`Device registered: ${device_id}`);

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
        id: device.id,
        deviceId: device.deviceId,
        name: device.name,
        status: device.isOnline ? 'online' : 'offline',
        lastSeen: device.lastSeen
      }
    });

  } catch (error) {
    logger.error('Device registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

/* =============================
   DEVICE HEARTBEAT
============================= */

router.post('/device/heartbeat', async (req, res) => {
  try {

    const deviceId =
      req.body.device_id ||
      req.body.deviceId ||
      req.headers['x-device-id'];

    if (!deviceId) {
      return res.status(400).json({
        success: false,
        message: 'Device ID required'
      });
    }

    const device = await Device.findOne({
      where: { deviceId }
    });

      if (!device) {
          return res.status(404).json({
              success: false,
              message: 'Device not found'
          });
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

router.get('/me', authenticateToken, authController.me);

/* =============================
   LOGOUT
============================= */

router.post('/logout', authenticateToken, authController.logout);

console.log("[AUTH ROUTE] File loaded completely");

module.exports = router;