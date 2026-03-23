console.log("[DEVICES ROUTE] File loading...");

const express = require('express');
console.log("[DEVICES ROUTE] express loaded");

const router = express.Router();
console.log("[DEVICES ROUTE] router created");

const { body, param } = require('express-validator');
console.log("[DEVICES ROUTE] express-validator loaded");

const { validateRequest } = require('../middleware/validation');
console.log("[DEVICES ROUTE] validation middleware loaded");

const deviceController = require('../controllers/deviceController');
console.log("[DEVICES ROUTE] deviceController loaded");

const authMiddleware = require('../middleware/auth');
console.log("[DEVICES ROUTE] auth middleware loaded");

const { requireRole } = authMiddleware;
console.log("[DEVICES ROUTE] authorize middleware ready");

const auth = authMiddleware;

/* ======================================================
   REGISTER DEVICE
====================================================== */

console.log("[DEVICES ROUTE] registering route POST /register");

router.post(
    '/register',
    [
        body('deviceId').notEmpty().withMessage('Device ID is required'),
        body('name').optional().isString(),
        body('model').optional().isString(),
        body('manufacturer').optional().isString(),
        body('androidVersion').optional().isString(),
        body('apiLevel').optional().isInt(),
        body('imei').optional().isString(),
        body('phoneNumber').optional().isMobilePhone(),
        body('fcmToken').optional().isString(),
        body('appVersion').optional().isString(),
    ],
    validateRequest,
    deviceController.registerDevice
);

/* ======================================================
   GET ALL DEVICES
====================================================== */

console.log("[DEVICES ROUTE] registering route GET /");

router.get(
    '/',
    auth.authenticateToken,
    requireRole('admin'),
    deviceController.getAllDevices
);

/* ======================================================
   GET DEVICE BY ID
====================================================== */

console.log("[DEVICES ROUTE] registering route GET /:deviceId");

router.get(
    '/:deviceId',
    auth.authenticateToken,
    [
        param('deviceId').isString().notEmpty(),
    ],
    validateRequest,
    requireRole('device', 'admin'),
    deviceController.getDevice
);

/* ======================================================
   UPDATE DEVICE
====================================================== */

console.log("[DEVICES ROUTE] registering route PATCH /:deviceId");

router.patch(
    '/:deviceId',
    [
        param('deviceId').isString().notEmpty(),
        body('name').optional().isString(),
        body('nickname').optional().isString(),
        body('status').optional().isIn(['active', 'inactive', 'suspended']),
    ],
    validateRequest,
    requireRole('device', 'admin'),
    deviceController.updateDevice
);

/* ======================================================
   DELETE DEVICE
====================================================== */

console.log("[DEVICES ROUTE] registering route DELETE /:deviceId");

router.delete(
    '/:deviceId',
    [
        param('deviceId').isString().notEmpty(),
    ],
    validateRequest,
    requireRole('admin'),
    deviceController.deleteDevice
);

/* ======================================================
   DEVICE STATUS
====================================================== */

console.log("[DEVICES ROUTE] registering route GET /:deviceId/status");

router.get(
    '/:deviceId/status',
    [
        param('deviceId').isString().notEmpty(),
    ],
    validateRequest,
    requireRole('device', 'admin'),
    deviceController.getDeviceStatus
);

/* ======================================================
   DEVICE HEARTBEAT
====================================================== */

console.log("[DEVICES ROUTE] registering route POST /:deviceId/heartbeat");

router.post(
    '/:deviceId/heartbeat',
    [
        param('deviceId').isString().notEmpty(),
        body('batteryLevel').optional().isFloat({ min: 0, max: 100 }),
        body('storage').optional().isObject(),
        body('network').optional().isObject(),
    ],
    validateRequest,
    requireRole('device'),
    deviceController.handleHeartbeat
);

/* ======================================================
   DEVICE STATISTICS
====================================================== */

console.log("[DEVICES ROUTE] registering route GET /:deviceId/statistics");

router.get(
    '/:deviceId/statistics',
    [
        param('deviceId').isString().notEmpty(),
    ],
    validateRequest,
    requireRole('device', 'admin'),
    deviceController.getDeviceStatistics
);

/* ======================================================
   LEGACY ROUTES
====================================================== */

console.log("[DEVICES ROUTE] registering legacy routes");

console.log("[DEVICES ROUTE] File loaded completely");

module.exports = router;