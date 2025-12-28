const { ScreenRecording, Device } = require('../../../models');
const { Op } = require('sequelize');
const logger = require('../../../utils/logger');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

/**
 * Get screen recordings for a device
 */
const getScreenRecordings = async (req, res) => {
    try {
        const { deviceId } = req.params;
        const { 
            startDate, 
            endDate, 
            page = 1,
            limit = 50 
        } = req.query;

        const offset = (page - 1) * limit;
        const where = { deviceId };
        
        // Add date filters if provided
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt[Op.gte] = new Date(startDate);
            if (endDate) where.createdAt[Op.lte] = new Date(endDate);
        }

        const { count, rows: recordings } = await ScreenRecording.findAndCountAll({
            where,
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset),
            include: [{
                model: Device,
                attributes: ['id', 'deviceName']
            }]
        });

        return res.json({
            success: true,
            data: recordings,
            pagination: {
                total: count,
                page: parseInt(page),
                totalPages: Math.ceil(count / limit)
            }
        });

    } catch (error) {
        logger.error('Error fetching screen recordings:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch screen recordings',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Get a single screen recording by ID
 */
const getScreenRecording = async (req, res) => {
    try {
        const { id } = req.params;

        const recording = await ScreenRecording.findByPk(id, {
            include: [{
                model: Device,
                attributes: ['id', 'deviceName']
            }]
        });

        if (!recording) {
            return res.status(404).json({
                success: false,
                error: 'Screen recording not found'
            });
        }

        return res.json({
            success: true,
            data: recording
        });

    } catch (error) {
        logger.error('Error fetching screen recording:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch screen recording'
        });
    }
};

/**
 * Delete screen recordings
 */
const deleteScreenRecordings = async (req, res) => {
    try {
        const { deviceId } = req.params;
        const { recordingIds = [] } = req.body;

        if (!Array.isArray(recordingIds) || recordingIds.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No recording IDs provided'
            });
        }

        // Verify all recordings belong to the device
        const recordings = await ScreenRecording.findAll({
            where: {
                id: recordingIds,
                deviceId
            }
        });

        if (recordings.length !== recordingIds.length) {
            return res.status(404).json({
                success: false,
                error: 'One or more recordings not found or access denied'
            });
        }

        // Delete files from storage
        for (const recording of recordings) {
            if (recording.filePath && fs.existsSync(recording.filePath)) {
                fs.unlinkSync(recording.filePath);
            }
            
            // Delete thumbnail if exists
            if (recording.thumbnailPath && fs.existsSync(recording.thumbnailPath)) {
                fs.unlinkSync(recording.thumbnailPath);
            }
        }

        // Delete from database
        await ScreenRecording.destroy({
            where: {
                id: recordingIds
            }
        });

        return res.json({
            success: true,
            message: `${recordings.length} recording(s) deleted successfully`
        });

    } catch (error) {
        logger.error('Error deleting screen recordings:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to delete screen recordings'
        });
    }
};

/**
 * Get screen recording statistics
 */
const getScreenRecordingStats = async (req, res) => {
    try {
        const { deviceId } = req.params;
        const { startDate, endDate } = req.query;

        const where = { deviceId };
        
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt[Op.gte] = new Date(startDate);
            if (endDate) where.createdAt[Op.lte] = new Date(endDate);
        }

        const stats = await ScreenRecording.findOne({
            attributes: [
                [ScreenRecording.sequelize.fn('COUNT', ScreenRecording.sequelize.col('id')), 'totalRecordings'],
                [ScreenRecording.sequelize.fn('SUM', ScreenRecording.sequelize.col('duration')), 'totalDuration'],
                [ScreenRecording.sequelize.fn('SUM', ScreenRecording.sequelize.col('fileSize')), 'totalSize'],
                [ScreenRecording.sequelize.fn('AVG', ScreenRecording.sequelize.col('duration')), 'avgDuration']
            ],
            where,
            raw: true
        });

        return res.json({
            success: true,
            data: {
                totalRecordings: parseInt(stats.totalRecordings) || 0,
                totalDuration: parseInt(stats.totalDuration) || 0,
                totalSize: parseInt(stats.totalSize) || 0,
                avgDuration: parseFloat(stats.avgDuration) || 0
            }
        });

    } catch (error) {
        logger.error('Error getting screen recording stats:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to get screen recording statistics'
        });
    }
};

/**
 * Start a new screen recording
 */
const startScreenRecording = async (req, res) => {
    try {
        const { deviceId } = req.params;
        const { 
            quality = 'high', 
            resolution = '720p',
            bitRate = 4000000,
            audioSource = 'mic',
            maxDuration = 300
        } = req.body;

        // Create a new recording record
        const recording = await ScreenRecording.create({
            id: uuidv4(),
            deviceId,
            status: 'pending',
            quality,
            resolution,
            bitRate,
            audioSource,
            maxDuration
        });

        // TODO: Send command to device to start recording
        // await sendCommandToDevice(deviceId, 'START_SCREEN_RECORDING', {
        //     recordingId: recording.id,
        //     quality,
        //     resolution,
        //     bitRate,
        //     audioSource,
        //     maxDuration
        // });

        return res.status(202).json({
            success: true,
            data: {
                recordingId: recording.id,
                status: 'pending'
            }
        });

    } catch (error) {
        logger.error('Error starting screen recording:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to start screen recording'
        });
    }
};

/**
 * Stop a screen recording
 */
const stopScreenRecording = async (req, res) => {
    try {
        const { recordingId } = req.params;

        const recording = await ScreenRecording.findByPk(recordingId);
        if (!recording) {
            return res.status(404).json({
                success: false,
                error: 'Recording not found'
            });
        }

        if (recording.status !== 'recording') {
            return res.status(400).json({
                success: false,
                error: 'Recording is not in progress'
            });
        }

        // TODO: Send command to device to stop recording
        // await sendCommandToDevice(recording.deviceId, 'STOP_SCREEN_RECORDING', {
        //     recordingId: recording.id
        // });

        // Update recording status
        await recording.update({
            status: 'processing'
        });

        return res.json({
            success: true,
            message: 'Stop command sent to device'
        });

    } catch (error) {
        logger.error('Error stopping screen recording:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to stop screen recording'
        });
    }
};

module.exports = {
    getScreenRecordings,
    getScreenRecording,
    deleteScreenRecordings,
    getScreenRecordingStats,
    startScreenRecording,
    stopScreenRecording
};
