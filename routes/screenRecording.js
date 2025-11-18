const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { ScreenRecording, Device } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { body, validationResult, query } = require('express-validator');
const logger = require('../utils/logger');
const router = express.Router();

// Configure multer for screen recording uploads
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../uploads/screen_recordings');
        try {
            await fs.mkdir(uploadDir, { recursive: true });
            cb(null, uploadDir);
        } catch (error) {
            cb(error);
        }
    },
    filename: (req, file, cb) => {
        const timestamp = Date.now();
        const deviceId = req.body.device_id || 'unknown';
        const extension = path.extname(file.originalname) || '.mp4';
        cb(null, `screen_recording_${deviceId}_${timestamp}${extension}`);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 500 * 1024 * 1024 // 500MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['video/mp4', 'video/webm', 'video/avi', 'video/mov'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only video files are allowed.'));
        }
    }
});

// POST /api/screen-recording/upload - Upload screen recording
router.post('/upload', upload.single('recording'), [
    body('device_id').notEmpty().withMessage('Device ID is required'),
    body('recording_id').notEmpty().withMessage('Recording ID is required'),
    body('duration').optional().isInt({ min: 0 }).withMessage('Duration must be a positive integer'),
    body('resolution').optional().matches(/^\d+x\d+$/).withMessage('Resolution must be in format WIDTHxHEIGHT'),
    body('frame_rate').optional().isInt({ min: 1, max: 120 }).withMessage('Frame rate must be between 1-120'),
    body('quality').optional().isIn(['low', 'medium', 'high', 'ultra']).withMessage('Invalid quality'),
    body('recording_type').optional().isIn(['manual', 'scheduled', 'triggered']).withMessage('Invalid recording type')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                success: false, 
                message: 'Validation failed', 
                errors: errors.array() 
            });
        }

        if (!req.file) {
            return res.status(400).json({ 
                success: false, 
                message: 'No recording file uploaded' 
            });
        }

        const {
            device_id,
            recording_id,
            duration,
            resolution,
            frame_rate,
            bit_rate,
            quality,
            recording_type,
            start_time,
            end_time,
            metadata,
            tags
        } = req.body;

        // Check if device exists
        const device = await Device.findOne({ where: { device_id } });
        if (!device) {
            return res.status(404).json({ 
                success: false, 
                message: 'Device not found' 
            });
        }

        // Get file stats
        const fileStats = await fs.stat(req.file.path);

        // Create screen recording record
        const screenRecording = await ScreenRecording.create({
            device_id,
            recording_id,
            file_name: req.file.filename,
            file_path: req.file.path,
            file_size: fileStats.size,
            duration: duration ? parseInt(duration) : null,
            resolution,
            frame_rate: frame_rate ? parseInt(frame_rate) : 30,
            bit_rate: bit_rate ? parseInt(bit_rate) : null,
            format: path.extname(req.file.filename).slice(1) || 'mp4',
            quality: quality || 'medium',
            recording_type: recording_type || 'manual',
            status: 'completed',
            start_time: start_time ? new Date(start_time) : new Date(),
            end_time: end_time ? new Date(end_time) : new Date(),
            metadata: metadata ? JSON.parse(metadata) : null,
            tags: tags ? JSON.parse(tags) : null,
            upload_status: 'completed',
            upload_progress: 100
        });

        logger.info(`Screen recording uploaded: ${recording_id} for device ${device_id}`);

        // Emit socket event for real-time updates
        if (req.app.get('io')) {
            req.app.get('io').emit('screen_recording_uploaded', {
                device_id,
                recording: screenRecording
            });
        }

        res.json({
            success: true,
            message: 'Screen recording uploaded successfully',
            data: screenRecording
        });

    } catch (error) {
        logger.error('Error uploading screen recording:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to upload screen recording',
            error: error.message 
        });
    }
});

// GET /api/screen-recording/device/:deviceId - Get screen recordings for device
router.get('/device/:deviceId', [
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1-100'),
    query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be non-negative'),
    query('status').optional().isIn(['recording', 'completed', 'failed', 'processing']).withMessage('Invalid status')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                success: false, 
                message: 'Validation failed', 
                errors: errors.array() 
            });
        }

        const { deviceId } = req.params;
        const { limit = 20, offset = 0, status } = req.query;

        const whereClause = { 
            device_id: deviceId,
            is_deleted: false
        };

        if (status) {
            whereClause.status = status;
        }

        const recordings = await ScreenRecording.findAll({
            where: whereClause,
            order: [['start_time', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset),
            include: [{
                model: Device,
                as: 'device',
                attributes: ['device_id', 'device_name', 'model']
            }]
        });

        const total = await ScreenRecording.count({ where: whereClause });

        res.json({
            success: true,
            data: recordings,
            pagination: {
                total,
                limit: parseInt(limit),
                offset: parseInt(offset),
                hasMore: offset + recordings.length < total
            }
        });

    } catch (error) {
        logger.error('Error fetching screen recordings:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch screen recordings',
            error: error.message 
        });
    }
});

// GET /api/screen-recording/:id/download - Download screen recording
router.get('/:id/download', async (req, res) => {
    try {
        const { id } = req.params;

        const recording = await ScreenRecording.findByPk(id);
        if (!recording) {
            return res.status(404).json({ 
                success: false, 
                message: 'Screen recording not found' 
            });
        }

        if (recording.is_deleted) {
            return res.status(404).json({ 
                success: false, 
                message: 'Screen recording has been deleted' 
            });
        }

        // Check if file exists
        try {
            await fs.access(recording.file_path);
        } catch (error) {
            return res.status(404).json({ 
                success: false, 
                message: 'Recording file not found on disk' 
            });
        }

        // Set appropriate headers
        res.setHeader('Content-Type', `video/${recording.format}`);
        res.setHeader('Content-Disposition', `attachment; filename="${recording.file_name}"`);
        res.setHeader('Content-Length', recording.file_size);

        // Stream the file
        const fileStream = require('fs').createReadStream(recording.file_path);
        fileStream.pipe(res);

        logger.info(`Screen recording downloaded: ${recording.recording_id}`);

    } catch (error) {
        logger.error('Error downloading screen recording:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to download screen recording',
            error: error.message 
        });
    }
});

// PUT /api/screen-recording/:id - Update screen recording
router.put('/:id', [
    body('status').optional().isIn(['recording', 'completed', 'failed', 'processing']).withMessage('Invalid status'),
    body('tags').optional().isArray().withMessage('Tags must be an array'),
    body('metadata').optional().isObject().withMessage('Metadata must be an object')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                success: false, 
                message: 'Validation failed', 
                errors: errors.array() 
            });
        }

        const { id } = req.params;
        const updateData = req.body;

        const recording = await ScreenRecording.findByPk(id);
        if (!recording) {
            return res.status(404).json({ 
                success: false, 
                message: 'Screen recording not found' 
            });
        }

        await recording.update(updateData);

        // Emit socket event
        if (req.app.get('io')) {
            req.app.get('io').emit('screen_recording_updated', {
                device_id: recording.device_id,
                recording
            });
        }

        res.json({
            success: true,
            message: 'Screen recording updated successfully',
            data: recording
        });

    } catch (error) {
        logger.error('Error updating screen recording:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to update screen recording',
            error: error.message 
        });
    }
});

// DELETE /api/screen-recording/:id - Delete screen recording
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const recording = await ScreenRecording.findByPk(id);
        if (!recording) {
            return res.status(404).json({ 
                success: false, 
                message: 'Screen recording not found' 
            });
        }

        // Soft delete
        await recording.update({ 
            is_deleted: true, 
            deleted_at: new Date() 
        });

        // Emit socket event
        if (req.app.get('io')) {
            req.app.get('io').emit('screen_recording_deleted', {
                device_id: recording.device_id,
                recording_id: recording.recording_id
            });
        }

        res.json({
            success: true,
            message: 'Screen recording deleted successfully'
        });

        logger.info(`Screen recording deleted: ${recording.recording_id}`);

    } catch (error) {
        logger.error('Error deleting screen recording:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to delete screen recording',
            error: error.message 
        });
    }
});

// GET /api/screen-recording/stats - Get screen recording statistics
router.get('/stats', [
    query('device_id').optional().notEmpty().withMessage('Device ID cannot be empty')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                success: false, 
                message: 'Validation failed', 
                errors: errors.array() 
            });
        }

        const { device_id } = req.query;
        const stats = await ScreenRecording.getRecordingStats(device_id);

        res.json({
            success: true,
            data: stats
        });

    } catch (error) {
        logger.error('Error fetching screen recording stats:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch statistics',
            error: error.message 
        });
    }
});

// POST /api/screen-recording/start - Start screen recording command
router.post('/start', [
    body('device_id').notEmpty().withMessage('Device ID is required'),
    body('quality').optional().isIn(['low', 'medium', 'high', 'ultra']).withMessage('Invalid quality'),
    body('duration').optional().isInt({ min: 1, max: 3600 }).withMessage('Duration must be between 1-3600 seconds'),
    body('resolution').optional().matches(/^\d+x\d+$/).withMessage('Resolution must be in format WIDTHxHEIGHT')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                success: false, 
                message: 'Validation failed', 
                errors: errors.array() 
            });
        }

        const { device_id, quality = 'medium', duration, resolution } = req.body;

        // Check if device exists
        const device = await Device.findOne({ where: { device_id } });
        if (!device) {
            return res.status(404).json({ 
                success: false, 
                message: 'Device not found' 
            });
        }

        // Create command to start recording
        const Command = require('../config/database').Command;
        const command = await Command.create({
            device_id,
            command_type: 'RecordScreen',
            command_data: {
                quality,
                duration,
                resolution,
                action: 'start'
            },
            status: 'pending'
        });

        // Emit socket event to device
        if (req.app.get('io')) {
            req.app.get('io').to(device_id).emit('new_command', command);
        }

        res.json({
            success: true,
            message: 'Screen recording start command sent',
            data: { command_id: command.id }
        });

        logger.info(`Screen recording start command sent to device ${device_id}`);

    } catch (error) {
        logger.error('Error starting screen recording:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to start screen recording',
            error: error.message 
        });
    }
});

// POST /api/screen-recording/stop - Stop screen recording command
router.post('/stop', [
    body('device_id').notEmpty().withMessage('Device ID is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                success: false, 
                message: 'Validation failed', 
                errors: errors.array() 
            });
        }

        const { device_id } = req.body;

        // Check if device exists
        const device = await Device.findOne({ where: { device_id } });
        if (!device) {
            return res.status(404).json({ 
                success: false, 
                message: 'Device not found' 
            });
        }

        // Create command to stop recording
        const Command = require('../config/database').Command;
        const command = await Command.create({
            device_id,
            command_type: 'RecordScreen',
            command_data: {
                action: 'stop'
            },
            status: 'pending'
        });

        // Emit socket event to device
        if (req.app.get('io')) {
            req.app.get('io').to(device_id).emit('new_command', command);
        }

        res.json({
            success: true,
            message: 'Screen recording stop command sent',
            data: { command_id: command.id }
        });

        logger.info(`Screen recording stop command sent to device ${device_id}`);

    } catch (error) {
        logger.error('Error stopping screen recording:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to stop screen recording',
            error: error.message 
        });
    }
});

module.exports = router;
