const express = require('express');
const { ScreenProjection, Device } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { body, validationResult, query } = require('express-validator');
const logger = require('../utils/logger');
const router = express.Router();

// POST /api/screen-projection/start - Start screen projection session
router.post('/start', [
    body('device_id').notEmpty().withMessage('Device ID is required'),
    body('projection_type').optional().isIn(['live_stream', 'remote_control', 'view_only']).withMessage('Invalid projection type'),
    body('quality').optional().isIn(['low', 'medium', 'high']).withMessage('Invalid quality'),
    body('frame_rate').optional().isInt({ min: 5, max: 60 }).withMessage('Frame rate must be between 5-60'),
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

        const { 
            device_id, 
            projection_type = 'view_only', 
            quality = 'medium', 
            frame_rate = 15, 
            resolution,
            max_viewers = 5
        } = req.body;

        // Check if device exists
        const device = await Device.findOne({ where: { device_id } });
        if (!device) {
            return res.status(404).json({ 
                success: false, 
                message: 'Device not found' 
            });
        }

        // Check for existing active projection
        const existingProjection = await ScreenProjection.findOne({
            where: { 
                device_id, 
                status: ['starting', 'active', 'paused'] 
            }
        });

        if (existingProjection) {
            return res.status(409).json({ 
                success: false, 
                message: 'Device already has an active projection session' 
            });
        }

        // Generate unique session ID
        const session_id = `proj_${device_id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const access_token = `token_${Math.random().toString(36).substr(2, 16)}`;

        // Create projection session
        const projection = await ScreenProjection.create({
            device_id,
            session_id,
            projection_type,
            quality,
            frame_rate: parseInt(frame_rate),
            resolution,
            max_viewers: parseInt(max_viewers),
            access_token,
            status: 'starting',
            settings: {
                compression: quality === 'low' ? 60 : quality === 'medium' ? 80 : 90,
                auto_adjust_quality: true,
                enable_audio: projection_type === 'remote_control'
            }
        });

        // Create command to start projection on device
        const Command = require('../config/database').Command;
        const command = await Command.create({
            device_id,
            command_type: 'StartScreenProjection',
            command_data: {
                session_id,
                projection_type,
                quality,
                frame_rate,
                resolution,
                server_endpoint: `${req.protocol}://${req.get('host')}/api/screen-projection/stream/${session_id}`
            },
            status: 'pending'
        });

        // Emit socket events
        if (req.app.get('io')) {
            req.app.get('io').to(device_id).emit('new_command', command);
            req.app.get('io').emit('projection_started', {
                device_id,
                session_id,
                projection
            });
        }

        res.json({
            success: true,
            message: 'Screen projection session started',
            data: {
                session_id,
                access_token,
                projection,
                viewer_url: `/admin/screen-projection/${session_id}?token=${access_token}`
            }
        });

        logger.info(`Screen projection started: ${session_id} for device ${device_id}`);

    } catch (error) {
        logger.error('Error starting screen projection:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to start screen projection',
            error: error.message 
        });
    }
});

// POST /api/screen-projection/stop - Stop screen projection session
router.post('/stop', [
    body('session_id').notEmpty().withMessage('Session ID is required')
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

        const { session_id } = req.body;

        const projection = await ScreenProjection.findOne({
            where: { session_id }
        });

        if (!projection) {
            return res.status(404).json({ 
                success: false, 
                message: 'Projection session not found' 
            });
        }

        // Update projection status
        await projection.update({
            status: 'stopped',
            end_time: new Date(),
            duration: Math.floor((new Date() - projection.start_time) / 1000)
        });

        // Create command to stop projection on device
        const Command = require('../config/database').Command;
        const command = await Command.create({
            device_id: projection.device_id,
            command_type: 'StopScreenProjection',
            command_data: { session_id },
            status: 'pending'
        });

        // Emit socket events
        if (req.app.get('io')) {
            req.app.get('io').to(projection.device_id).emit('new_command', command);
            req.app.get('io').emit('projection_stopped', {
                device_id: projection.device_id,
                session_id
            });
        }

        res.json({
            success: true,
            message: 'Screen projection stopped',
            data: projection
        });

        logger.info(`Screen projection stopped: ${session_id}`);

    } catch (error) {
        logger.error('Error stopping screen projection:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to stop screen projection',
            error: error.message 
        });
    }
});

// GET /api/screen-projection/active - Get active projection sessions
router.get('/active', async (req, res) => {
    try {
        const activeProjections = await ScreenProjection.getActiveProjections();

        res.json({
            success: true,
            data: activeProjections
        });

    } catch (error) {
        logger.error('Error fetching active projections:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch active projections',
            error: error.message 
        });
    }
});

// GET /api/screen-projection/device/:deviceId - Get projection history for device
router.get('/device/:deviceId', [
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1-50'),
    query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be non-negative')
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
        const { limit = 20, offset = 0 } = req.query;

        const projections = await ScreenProjection.getProjectionsByDevice(
            deviceId, 
            parseInt(limit), 
            parseInt(offset)
        );

        const total = await ScreenProjection.count({ 
            where: { device_id: deviceId } 
        });

        res.json({
            success: true,
            data: projections,
            pagination: {
                total,
                limit: parseInt(limit),
                offset: parseInt(offset),
                hasMore: offset + projections.length < total
            }
        });

    } catch (error) {
        logger.error('Error fetching device projections:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch device projections',
            error: error.message 
        });
    }
});

// POST /api/screen-projection/stream/:sessionId - Handle streaming data from device
router.post('/stream/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { frame_data, frame_number, timestamp } = req.body;

        const projection = await ScreenProjection.findOne({
            where: { session_id: sessionId, status: ['starting', 'active'] }
        });

        if (!projection) {
            return res.status(404).json({ 
                success: false, 
                message: 'Active projection session not found' 
            });
        }

        // Update projection status to active if starting
        if (projection.status === 'starting') {
            await projection.update({ status: 'active' });
        }

        // Update frame statistics
        await projection.updateStats(1, Buffer.byteLength(frame_data, 'base64'));

        // Broadcast frame to viewers via Socket.IO
        if (req.app.get('io')) {
            req.app.get('io').to(`projection_${sessionId}`).emit('screen_frame', {
                session_id: sessionId,
                frame_data,
                frame_number,
                timestamp
            });
        }

        res.json({ success: true });

    } catch (error) {
        logger.error('Error handling stream data:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to process stream data',
            error: error.message 
        });
    }
});

// POST /api/screen-projection/join/:sessionId - Join projection as viewer
router.post('/join/:sessionId', [
    body('viewer_name').optional().isLength({ min: 1, max: 50 }).withMessage('Viewer name must be 1-50 characters'),
    body('access_token').notEmpty().withMessage('Access token is required')
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

        const { sessionId } = req.params;
        const { viewer_name = 'Anonymous', access_token } = req.body;

        const projection = await ScreenProjection.findOne({
            where: { session_id: sessionId, status: ['starting', 'active'] }
        });

        if (!projection) {
            return res.status(404).json({ 
                success: false, 
                message: 'Active projection session not found' 
            });
        }

        // Verify access token
        if (projection.access_token !== access_token) {
            return res.status(403).json({ 
                success: false, 
                message: 'Invalid access token' 
            });
        }

        // Check viewer limit
        if (projection.viewer_count >= projection.max_viewers) {
            return res.status(429).json({ 
                success: false, 
                message: 'Maximum viewers reached' 
            });
        }

        // Add viewer
        const viewer = await projection.addViewer({
            name: viewer_name,
            ip: req.ip,
            user_agent: req.get('User-Agent')
        });

        res.json({
            success: true,
            message: 'Joined projection session',
            data: {
                viewer_id: viewer.id,
                session_id: sessionId,
                projection_info: {
                    resolution: projection.resolution,
                    frame_rate: projection.frame_rate,
                    quality: projection.quality
                }
            }
        });

        logger.info(`Viewer joined projection: ${sessionId}, viewer: ${viewer_name}`);

    } catch (error) {
        logger.error('Error joining projection:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to join projection',
            error: error.message 
        });
    }
});

// POST /api/screen-projection/leave/:sessionId - Leave projection as viewer
router.post('/leave/:sessionId', [
    body('viewer_id').notEmpty().withMessage('Viewer ID is required')
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

        const { sessionId } = req.params;
        const { viewer_id } = req.body;

        const projection = await ScreenProjection.findOne({
            where: { session_id: sessionId }
        });

        if (!projection) {
            return res.status(404).json({ 
                success: false, 
                message: 'Projection session not found' 
            });
        }

        await projection.removeViewer(viewer_id);

        res.json({
            success: true,
            message: 'Left projection session'
        });

        logger.info(`Viewer left projection: ${sessionId}, viewer: ${viewer_id}`);

    } catch (error) {
        logger.error('Error leaving projection:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to leave projection',
            error: error.message 
        });
    }
});

// GET /api/screen-projection/stats - Get projection statistics
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
        const stats = await ScreenProjection.getProjectionStats(device_id);

        res.json({
            success: true,
            data: stats
        });

    } catch (error) {
        logger.error('Error fetching projection stats:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch statistics',
            error: error.message 
        });
    }
});

module.exports = router;
