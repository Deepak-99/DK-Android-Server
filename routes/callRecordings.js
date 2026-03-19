const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { param, query } = require('express-validator');
const { validateRequest } = require('../middleware/validation');
const { authorize } = require('../middleware/auth');
const callRecordingController = require('../controllers/callRecordingController');
const auth = require('../middleware/auth');

// --- Multer Configuration ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/call-recordings';
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `rec-${req.params.deviceId}-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 100 * 1024 * 1024 } // 100MB
});

// --- Routes ---

// Upload recording (Device only)
router.post(
    '/devices/:deviceId/upload',
    authorize('device'),
    upload.single('recording'),
    callRecordingController.uploadRecording
);

// Get recordings (Admin/User)
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
    [param('deviceId').isUUID()],
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


// Dashboard
router.get('/', auth, callRecordingController.getRecordings);
router.get('/:id/download', auth, callRecordingController.downloadRecording);

// Device ingest
router.post('/upload', callRecordingController.uploadRecording);
module.exports = router;
