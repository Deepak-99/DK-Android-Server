const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const { validateRequest } = require('../../../middleware/validation');
const deviceController = require('../../../controllers/api/v1/deviceController');
const { authorize } = require('../../../middleware/auth');

// Register a new device
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

// Get all devices (admin only)
router.get(
  '/',
  authorize('admin'),
  deviceController.getAllDevices
);

// Get device by ID
router.get(
  '/:deviceId',
  [
    param('deviceId').isString().notEmpty(),
  ],
  validateRequest,
  authorize('device', 'admin'),
  deviceController.getDevice
);

// Update device information
router.patch(
  '/:deviceId',
  [
    param('deviceId').isString().notEmpty(),
    body('name').optional().isString(),
    body('nickname').optional().isString(),
    body('status').optional().isIn(['active', 'inactive', 'suspended']),
  ],
  validateRequest,
  authorize('device', 'admin'),
  deviceController.updateDevice
);

// Delete a device (admin only)
router.delete(
  '/:deviceId',
  [
    param('deviceId').isString().notEmpty(),
  ],
  validateRequest,
  authorize('admin'),
  deviceController.deleteDevice
);

// Get device status
router.get(
  '/:deviceId/status',
  [
    param('deviceId').isString().notEmpty(),
  ],
  validateRequest,
  authorize('device', 'admin'),
  deviceController.getDeviceStatus
);

// Handle device heartbeat
router.post(
  '/:deviceId/heartbeat',
  [
    param('deviceId').isString().notEmpty(),
    body('batteryLevel').optional().isFloat({ min: 0, max: 100 }),
    body('storage').optional().isObject(),
    body('network').optional().isObject(),
  ],
  validateRequest,
  authorize('device'),
  deviceController.handleHeartbeat
);

// Get device statistics
router.get(
  '/:deviceId/statistics',
  [
    param('deviceId').isString().notEmpty(),
  ],
  validateRequest,
  authorize('device', 'admin'),
  deviceController.getDeviceStatistics
);

module.exports = router;
