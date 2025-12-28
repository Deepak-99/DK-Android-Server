// routes/api/v1/files.js
const express = require('express');
const router = express.Router();
const { param } = require('express-validator');
const { validateRequest } = require('../../../middleware/validation');
const fileController = require('../../../controllers/api/v1/fileController');
const {
    uploadCallRecording,
    uploadScreenRecording,
    uploadScreenshot
} = require('../../../utils/storage');
const { authorize } = require('../../../middleware/auth');

// Upload call recording
router.post(
    '/devices/:deviceId/call-recordings',
    [
        param('deviceId').isUUID().withMessage('Invalid device ID'),
        // Add any additional validation for call recording
    ],
    validateRequest,
    authorize('device:write'),
    (req, res, next) => {
        uploadCallRecording(req, res, (err) => {
            if (err) {
                return res.status(400).json({
                    success: false,
                    error: err.message
                });
            }
            next();
        });
    },
    fileController.uploadCallRecording
);

// Upload screen recording
router.post(
    '/devices/:deviceId/screen-recordings',
    [
        param('deviceId').isUUID().withMessage('Invalid device ID'),
        // Add any additional validation for screen recording
    ],
    validateRequest,
    authorize('device:write'),
    (req, res, next) => {
        uploadScreenRecording(req, res, (err) => {
            if (err) {
                return res.status(400).json({
                    success: false,
                    error: err.message
                });
            }
            next();
        });
    },
    fileController.uploadScreenRecording
);

// Upload screenshot
router.post(
    '/devices/:deviceId/screenshots',
    [
        param('deviceId').isUUID().withMessage('Invalid device ID'),
        // Add any additional validation for screenshots
    ],
    validateRequest,
    authorize('device:write'),
    (req, res, next) => {
        uploadScreenshot(req, res, (err) => {
            if (err) {
                return res.status(400).json({
                    success: false,
                    error: err.message
                });
            }
            next();
        });
    },
    fileController.uploadScreenshot
);

// Delete file
router.delete(
    '/files/:type/:id',
    [
        param('type').isIn(['call-recording', 'screen-recording', 'screenshot']),
        param('id').isUUID()
    ],
    validateRequest,
    authorize('admin', 'device:write'),
    fileController.deleteFile
);

module.exports = router;