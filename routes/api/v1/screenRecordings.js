const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const { validateRequest } = require('../../../middleware/validation');
const screenRecordingController = require('../../../controllers/api/v1/screenRecordingController');
const { authorize } = require('../../../middleware/auth');

// Get screen recordings for a device
router.get(
  '/devices/:deviceId/screen-recordings',
  [
    param('deviceId').isUUID().withMessage('Invalid device ID'),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 })
  ],
  validateRequest,
  authorize('admin', 'device:read'),
  screenRecordingController.getScreenRecordings
);

// Get a single screen recording
router.get(
  '/screen-recordings/:id',
  [
    param('id').isUUID().withMessage('Invalid recording ID')
  ],
  validateRequest,
  authorize('admin', 'device:read'),
  screenRecordingController.getScreenRecording
);

// Delete screen recordings
router.delete(
  '/devices/:deviceId/screen-recordings',
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
  screenRecordingController.deleteScreenRecordings
);

// Get screen recording statistics
router.get(
  '/devices/:deviceId/screen-recordings/statistics',
  [
    param('deviceId').isUUID().withMessage('Invalid device ID'),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601()
  ],
  validateRequest,
  authorize('admin', 'device:read'),
  screenRecordingController.getScreenRecordingStats
);

// Start a new screen recording
router.post(
  '/devices/:deviceId/screen-recordings/start',
  [
    param('deviceId').isUUID().withMessage('Invalid device ID'),
    body('quality').optional().isIn(['low', 'medium', 'high', 'ultra']),
    body('resolution').optional().isIn(['480p', '720p', '1080p', '1440p']),
    body('bitRate').optional().isInt({ min: 1000000, max: 20000000 }),
    body('audioSource').optional().isIn(['none', 'mic', 'device', 'both']),
    body('maxDuration').optional().isInt({ min: 10, max: 1800 })
  ],
  validateRequest,
  authorize('admin', 'device:control'),
  screenRecordingController.startScreenRecording
);

// Stop a screen recording
router.post(
  '/screen-recordings/:recordingId/stop',
  [
    param('recordingId').isUUID().withMessage('Invalid recording ID')
  ],
  validateRequest,
  authorize('admin', 'device:control'),
  screenRecordingController.stopScreenRecording
);

module.exports = router;
