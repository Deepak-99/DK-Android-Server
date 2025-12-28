const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const { validateRequest } = require('../../../middleware/validation');
const mediaController = require('../../../controllers/api/v1/mediaController');
const { authorize } = require('../../../middleware/auth');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../../../uploads/temp'));
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({ 
    storage,
    limits: {
        fileSize: 100 * 1024 * 1024 // 100MB limit
    },
    fileFilter: (req, file, cb) => {
        // Accept all file types
        cb(null, true);
    }
});

// Sync media files from device
router.post(
    '/:deviceId/sync',
    [
        param('deviceId').isUUID().withMessage('Invalid device ID'),
        body('files').isArray().withMessage('Files must be an array'),
        body('files.*.id').isString().notEmpty(),
        body('files.*.path').isString().notEmpty(),
        body('files.*.type').isString().notEmpty(),
        body('files.*.mimeType').isString().notEmpty(),
        body('files.*.size').isInt({ min: 0 }),
        body('files.*.width').optional().isInt({ min: 0 }),
        body('files.*.height').optional().isInt({ min: 0 }),
        body('files.*.duration').optional().isFloat({ min: 0 }),
        body('files.*.content').optional().isString(),
        body('files.*.metadata').optional().isObject(),
        body('files.*.isHidden').optional().isBoolean(),
        body('files.*.isFavorite').optional().isBoolean(),
        body('files.*.capturedAt').optional().isISO8601()
    ],
    validateRequest,
    authorize('device'),
    mediaController.syncMedia
);

// Get media files with filters
router.get(
    '/:deviceId/files',
    [
        param('deviceId').isUUID().withMessage('Invalid device ID'),
        query('type').optional().isString(),
        query('mimeType').optional().isString(),
        query('minSize').optional().isInt({ min: 0 }),
        query('maxSize').optional().isInt({ min: 0 }),
        query('startDate').optional().isISO8601(),
        query('endDate').optional().isISO8601(),
        query('isHidden').optional().isBoolean(),
        query('isFavorite').optional().isBoolean(),
        query('search').optional().isString(),
        query('page').optional().isInt({ min: 1 }),
        query('limit').optional().isInt({ min: 1, max: 1000 })
    ],
    validateRequest,
    authorize('admin', 'device'),
    mediaController.getMediaFiles
);

// Stream media file
router.get(
    '/:deviceId/file/*',
    [
        param('deviceId').isUUID().withMessage('Invalid device ID')
    ],
    validateRequest,
    authorize('admin', 'device'),
    mediaController.streamMedia
);

// Serve thumbnail
router.get(
    '/:deviceId/thumbnail/*',
    [
        param('deviceId').isUUID().withMessage('Invalid device ID')
    ],
    mediaController.serveThumbnail
);

// Upload media file
router.post(
    '/:deviceId/upload',
    [
        param('deviceId').isUUID().withMessage('Invalid device ID'),
        upload.single('file'),
        body('type').optional().isString(),
        body('metadata').optional().isString()
    ],
    validateRequest,
    authorize('admin', 'device'),
    mediaController.uploadMedia
);

// Update media metadata
router.patch(
    '/:deviceId/files/:fileId',
    [
        param('deviceId').isUUID().withMessage('Invalid device ID'),
        param('fileId').isUUID().withMessage('Invalid file ID'),
        body('isHidden').optional().isBoolean(),
        body('isFavorite').optional().isBoolean(),
        body('metadata').optional().isObject(),
        body('capturedAt').optional().isISO8601()
    ],
    validateRequest,
    authorize('admin', 'device'),
    mediaController.updateMedia
);

// Delete media files
router.delete(
    '/:deviceId/files',
    [
        param('deviceId').isUUID().withMessage('Invalid device ID'),
        body('fileIds').optional().isArray(),
        body('all').optional().isBoolean()
    ],
    validateRequest,
    authorize('admin', 'device'),
    mediaController.deleteMedia
);

// Get media statistics
router.get(
    '/:deviceId/statistics',
    [
        param('deviceId').isUUID().withMessage('Invalid device ID'),
        query('startDate').optional().isISO8601(),
        query('endDate').optional().isISO8601()
    ],
    validateRequest,
    authorize('admin', 'device'),
    mediaController.getMediaStatistics
);

// Search media files
router.get(
    '/:deviceId/search',
    [
        param('deviceId').isUUID().withMessage('Invalid device ID'),
        query('query').isString().notEmpty(),
        query('type').optional().isString(),
        query('startDate').optional().isISO8601(),
        query('endDate').optional().isISO8601(),
        query('page').optional().isInt({ min: 1 }),
        query('limit').optional().isInt({ min: 1, max: 1000 })
    ],
    validateRequest,
    authorize('admin', 'device'),
    mediaController.searchMedia
);

module.exports = router;
