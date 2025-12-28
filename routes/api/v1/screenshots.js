const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const { validateRequest } = require('../../../middleware/validation');
const screenshotController = require('../../../controllers/api/v1/screenshotController');
const { authorize } = require('../../../middleware/auth');

// Get screenshots for a device
router.get(
  '/devices/:deviceId/screenshots',
  [
    param('deviceId').isUUID().withMessage('Invalid device ID'),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 })
  ],
  validateRequest,
  authorize('admin', 'device:read'),
  screenshotController.getScreenshots
);

// Get a single screenshot (returns the image file)
router.get(
  '/screenshots/:id',
  [
    param('id').isUUID().withMessage('Invalid screenshot ID')
  ],
  validateRequest,
  authorize('admin', 'device:read'),
  screenshotController.getScreenshot
);

// Get screenshot metadata (returns JSON data instead of the image)
router.get(
  '/screenshots/:id/metadata',
  [
    param('id').isUUID().withMessage('Invalid screenshot ID')
  ],
  validateRequest,
  authorize('admin', 'device:read'),
  (req, res, next) => {
    // Set a flag to indicate we want metadata, not the file
    req.returnMetadata = true;
    next();
  },
  screenshotController.getScreenshot
);

// Delete screenshots
router.delete(
  '/devices/:deviceId/screenshots',
  [
    param('deviceId').isUUID().withMessage('Invalid device ID'),
    body('screenshotIds')
      .isArray({ min: 1 })
      .withMessage('At least one screenshot ID is required'),
    body('screenshotIds.*')
      .isUUID()
      .withMessage('Invalid screenshot ID')
  ],
  validateRequest,
  authorize('admin', 'device:write'),
  screenshotController.deleteScreenshots
);

// Get screenshot statistics
router.get(
  '/devices/:deviceId/screenshots/statistics',
  [
    param('deviceId').isUUID().withMessage('Invalid device ID'),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601()
  ],
  validateRequest,
  authorize('admin', 'device:read'),
  screenshotController.getScreenshotStats
);

// Take a new screenshot
router.post(
  '/devices/:deviceId/screenshots',
  [
    param('deviceId').isUUID().withMessage('Invalid device ID'),
    body('quality').optional().isIn(['low', 'medium', 'high']),
    body('width').optional().isInt({ min: 100, max: 7680 }),
    body('height').optional().isInt({ min: 100, max: 4320 }),
    body('delay').optional().isInt({ min: 0, max: 10 })
  ],
  validateRequest,
  authorize('admin', 'device:control'),
  screenshotController.takeScreenshot
);

module.exports = router;
