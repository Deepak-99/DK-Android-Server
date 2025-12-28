// routes/api/v1/deviceRoutes.js
const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const { validateRequest } = require('../../../middleware/validation');
const deviceController = require('../../../controllers/api/v1/deviceController');
const { authorize } = require('../../../middleware/auth');

// Register a new device
router.post(
    '/register',
    [
        body('deviceName').isString().notEmpty(),
        body('model').isString().notEmpty(),
        body('manufacturer').isString().notEmpty(),
        body('osVersion').isString().notEmpty(),
        body('sdkVersion').isString().notEmpty(),
        body('appVersion').isString().notEmpty(),
        body('fcmToken').isString().notEmpty(),
        body('imei').isString().optional(),
        body('phoneNumber').isString().optional(),
        body('simSerial').isString().optional(),
        body('simOperator').isString().optional(),
        body('networkOperator').isString().optional(),
        body('macAddress').isString().optional(),
        body('ipAddress').isString().optional(),
        body('deviceType').isIn(['android', 'ios']).optional()
    ],
    validateRequest,
    deviceController.registerDevice
);

// Update device information
router.patch(
    '/:deviceId',
    [
        param('deviceId').isUUID().withMessage('Invalid device ID'),
        body('deviceName').optional().isString(),
        body('fcmToken').optional().isString(),
        body('appVersion').optional().isString(),
        body('osVersion').optional().isString(),
        body('sdkVersion').optional().isString(),
        body('phoneNumber').optional().isString(),
        body('simSerial').optional().isString(),
        body('simOperator').optional().isString(),
        body('networkOperator').optional().isString(),
        body('ipAddress').optional().isString(),
        body('isActive').optional().isBoolean(),
        body('isOnline').optional().isBoolean()
    ],
    validateRequest,
    authorize('admin', 'device'),
    deviceController.updateDevice
);

// Update device status
router.post(
    '/:deviceId/status',
    [
        param('deviceId').isUUID().withMessage('Invalid device ID'),
        body('batteryLevel').optional().isInt({ min: 0, max: 100 }),
        body('isCharging').optional().isBoolean(),
        body('isLowPowerMode').optional().isBoolean(),
        body('networkType').optional().isString(),
        body('storage').optional().isObject(),
        body('storage.total').if(body('storage').exists()).isInt({ min: 0 }),
        body('storage.available').if(body('storage').exists()).isInt({ min: 0 }),
        body('storage.used').if(body('storage').exists()).isInt({ min: 0 }),
        body('memory').optional().isObject(),
        body('memory.total').if(body('memory').exists()).isInt({ min: 0 }),
        body('memory.available').if(body('memory').exists()).isInt({ min: 0 }),
        body('memory.used').if(body('memory').exists()).isInt({ min: 0 }),
        body('cpuUsage').optional().isInt({ min: 0, max: 100 })
    ],
    validateRequest,
    authorize('device'),
    deviceController.updateDeviceStatus
);

// Get device information
router.get(
    '/:deviceId',
    [
        param('deviceId').isUUID().withMessage('Invalid device ID')
    ],
    validateRequest,
    authorize('admin', 'device'),
    deviceController.getDevice
);

// List devices with filters
router.get(
    '/',
    [
        query('search').optional().isString(),
        query('isActive').optional().isBoolean(),
        query('isOnline').optional().isBoolean(),
        query('deviceType').optional().isIn(['android', 'ios']),
        query('page').optional().isInt({ min: 1 }),
        query('limit').optional().isInt({ min: 1, max: 100 }),
        query('sortBy').optional().isIn(['deviceName', 'lastSeen', 'createdAt']),
        query('sortOrder').optional().isIn(['ASC', 'DESC'])
    ],
    validateRequest,
    authorize('admin'),
    deviceController.listDevices
);

// Delete device
router.delete(
    '/:deviceId',
    [
        param('deviceId').isUUID().withMessage('Invalid device ID')
    ],
    validateRequest,
    authorize('admin'),
    deviceController.deleteDevice
);

// Execute command on device
router.post(
    '/:deviceId/commands',
    [
        param('deviceId').isUUID().withMessage('Invalid device ID'),
        body('command').isString().notEmpty(),
        body('params').optional().isObject()
    ],
    validateRequest,
    authorize('admin'),
    deviceController.executeCommand
);

// Get command status
router.get(
    '/:deviceId/commands/:commandId',
    [
        param('deviceId').isUUID().withMessage('Invalid device ID'),
        param('commandId').isUUID().withMessage('Invalid command ID')
    ],
    validateRequest,
    authorize('admin', 'device'),
    deviceController.getCommandStatus
);

// Get device activity logs
router.get(
    '/:deviceId/activity',
    [
        param('deviceId').isUUID().withMessage('Invalid device ID'),
        query('startDate').optional().isISO8601(),
        query('endDate').optional().isISO8601(),
        query('type').optional().isString(),
        query('limit').optional().isInt({ min: 1, max: 1000 })
    ],
    validateRequest,
    authorize('admin'),
    deviceController.getActivityLogs
);

// Get device statistics
router.get(
    '/:deviceId/statistics',
    [
        param('deviceId').isUUID().withMessage('Invalid device ID')
    ],
    validateRequest,
    authorize('admin', 'device'),
    deviceController.getDeviceStatistics
);

module.exports = router;