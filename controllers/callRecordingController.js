const { CallRecording, Device } = require('../../../models');
const { Op } = require('sequelize');
const logger = require('../../../utils/logger');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

/**
 * Get call recordings for a device
 */
const getCallRecordings = async (req, res) => {
    try {
        const { deviceId } = req.params;
        const { 
            startDate, 
            endDate, 
            type,
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

        // Add type filter if provided
        if (type) {
            where.type = type;
        }

        const { count, rows: recordings } = await CallRecording.findAndCountAll({
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
        logger.error('Error fetching call recordings:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch call recordings',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Get a single call recording by ID
 */
const getCallRecording = async (req, res) => {
    try {
        const { id } = req.params;

        const recording = await CallRecording.findByPk(id, {
            include: [{
                model: Device,
                attributes: ['id', 'deviceName']
            }]
        });

        if (!recording) {
            return res.status(404).json({
                success: false,
                error: 'Call recording not found'
            });
        }

        return res.json({
            success: true,
            data: recording
        });

    } catch (error) {
        logger.error('Error fetching call recording:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch call recording'
        });
    }
};

/**
 * Delete call recordings
 */
const deleteCallRecordings = async (req, res) => {
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
        const recordings = await CallRecording.findAll({
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
        }

        // Delete from database
        await CallRecording.destroy({
            where: {
                id: recordingIds
            }
        });

        return res.json({
            success: true,
            message: `${recordings.length} recording(s) deleted successfully`
        });

    } catch (error) {
        logger.error('Error deleting call recordings:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to delete call recordings'
        });
    }
};

/**
 * Get call recording statistics
 */
const getCallRecordingStats = async (req, res) => {
    try {
        const { deviceId } = req.params;
        const { startDate, endDate } = req.query;

        const where = { deviceId };
        
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt[Op.gte] = new Date(startDate);
            if (endDate) where.createdAt[Op.lte] = new Date(endDate);
        }

        const stats = await CallRecording.findAll({
            attributes: [
                'type',
                [CallRecording.sequelize.fn('COUNT', CallRecording.sequelize.col('id')), 'count'],
                [CallRecording.sequelize.fn('SUM', CallRecording.sequelize.col('duration')), 'totalDuration'],
                [CallRecording.sequelize.fn('AVG', CallRecording.sequelize.col('duration')), 'avgDuration']
            ],
            where,
            group: ['type'],
            raw: true
        });

        const total = await CallRecording.count({ where });
        const totalSize = await CallRecording.sum('fileSize', { where });

        return res.json({
            success: true,
            data: {
                totalRecordings: total,
                totalSize: totalSize || 0,
                byType: stats.reduce((acc, stat) => {
                    acc[stat.type] = {
                        count: parseInt(stat.count),
                        totalDuration: parseInt(stat.totalDuration) || 0,
                        avgDuration: parseFloat(stat.avgDuration) || 0
                    };
                    return acc;
                }, {})
            }
        });

    } catch (error) {
        logger.error('Error getting call recording stats:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to get call recording statistics'
        });
    }
};

module.exports = {
    getCallRecordings,
    getCallRecording,
    deleteCallRecordings,
    getCallRecordingStats
};
