const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const { validateRequest } = require('../../../middleware/validation');
const callRecordingController = require('../../../controllers/api/v1/callRecordingController');
const { authorize } = require('../../../middleware/auth');

// Get call recordings for a device
router.get(
  '/devices/:deviceId/recordings',
  [
    param('deviceId').isUUID().withMessage('Invalid device ID'),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('type').optional().isString(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 })
  ],
  validateRequest,
  authorize('admin', 'device:read'),
  callRecordingController.getCallRecordings
);

// Get a single call recording
router.get(
  '/recordings/:id',
  [
    param('id').isUUID().withMessage('Invalid recording ID')
  ],
  validateRequest,
  authorize('admin', 'device:read'),
  callRecordingController.getCallRecording
);

// Delete call recordings
router.delete(
  '/devices/:deviceId/recordings',
  [
    param('deviceId').isUUID().withMessage('Invalid device ID'),
    body('recordingIds')
      .isArray({ min: 1 })
      .withMessage('At least one recording ID is required'),
    body('recordingIds.*')
      .isUUID()
      .withMessage('Invalid recording ID')
  ],
  validateRequest,
  authorize('admin', 'device:write'),
  callRecordingController.deleteCallRecordings
);

// Get call recording statistics
router.get(
  '/devices/:deviceId/recordings/statistics',
  [
    param('deviceId').isUUID().withMessage('Invalid device ID'),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601()
  ],
  validateRequest,
  authorize('admin', 'device:read'),
  callRecordingController.getCallRecordingStats
);

module.exports = router;
