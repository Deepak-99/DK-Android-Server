const express = require('express');
const router = express.Router();
const { param, query } = require('express-validator');
const { validateRequest } = require('../middleware/validation');
const fileController = require('../controllers/filesController');
const {
    uploadCallRecording,
    uploadScreenRecording,
    uploadScreenshot
} = require('../utils/storage');
const { authorize } = require('../middleware/auth');
const auth = require('../middleware/auth');

/**
 * SECTION 1: DEVICE UPLOADS
 * These endpoints are used by the Android app to send captured data.
 */

// Upload call recording
router.post(
    '/devices/:deviceId/call-recordings',
    [param('deviceId').isUUID().withMessage('Invalid device ID')],
    validateRequest,
    authorize('device:write'),
    uploadCallRecording, // Cleaner: Multer handles errors automatically or passes to global handler
    fileController.uploadCallRecording
);

// Upload screen recording
router.post(
    '/devices/:deviceId/screen-recordings',
    [param('deviceId').isUUID().withMessage('Invalid device ID')],
    validateRequest,
    authorize('device:write'),
    uploadScreenRecording,
    fileController.uploadScreenRecording
);

// Upload screenshot
router.post(
    '/devices/:deviceId/screenshots',
    [param('deviceId').isUUID().withMessage('Invalid device ID')],
    validateRequest,
    authorize('device:write'),
    uploadScreenshot,
    fileController.uploadScreenshot
);

/**
 * SECTION 2: REMOTE EXPLORER (The "New" Combined Part)
 * These endpoints allow an Admin to browse the phone's live file system.
 */

// List files on the device live
router.get(
    '/devices/:deviceId/explorer',
    [
        param('deviceId').isUUID().withMessage('Invalid device ID'),
        query('path').optional().isString()
    ],
    validateRequest,
    authorize('admin'), // Only admins should browse the device file system
    fileController.listRemoteFiles
);

// Download a specific file from the device live
router.get(
    '/devices/:deviceId/explorer/download',
    [
        param('deviceId').isUUID().withMessage('Invalid device ID'),
        query('path').notEmpty().withMessage('Remote file path is required')
    ],
    validateRequest,
    authorize('admin'),
    fileController.downloadFromDevice
);

/**
 * SECTION 3: SERVER FILE MANAGEMENT
 * Deleting files that are already stored on your server.
 */

// Delete a forensic file from the server disk and database
router.delete(
    '/files/:type/:id',
    [
        param('type').isIn(['call-recording', 'screen-recording', 'screenshot']),
        param('id').isUUID()
    ],
    validateRequest,
    authorize('admin'), // Usually only admins should delete server data
    fileController.deleteServerFile
);

// Dashboard
router.get('/', auth, fileController.listFiles);
router.get('/download/:id', auth, fileController.downloadFile);

// Device
router.post('/upload', fileController.uploadFile);

module.exports = router;