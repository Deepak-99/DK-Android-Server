const { CallRecording, Device } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

/**
 * Handle File Upload and Database Entry
 */
const uploadRecording = async (req, res) => {
    const t = await sequelize.transaction(); // Start transaction
    try {
        const { deviceId } = req.params;

        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No audio file uploaded' });
        }

        // 1. Verify Device exists
        const device = await Device.findOne({ where: { id: deviceId } });
        if (!device) {
            if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
            return res.status(404).json({ success: false, error: 'Device not found' });
        }

        // 2. Create Database Record
        const recording = await CallRecording.create({
            deviceId,
            phoneNumber: req.body.phoneNumber,
            contactName: req.body.contactName,
            type: req.body.type,
            duration: parseInt(req.body.duration) || 0,
            filePath: req.file.path,
            fileName: req.file.originalname,
            fileSize: req.file.size,
            format: path.extname(req.file.originalname).replace('.', ''),
            status: 'completed'
        }, { transaction: t });

        await t.commit(); // Save everything

        return res.status(201).json({
            success: true,
            data: recording
        });

    } catch (error) {
        await t.rollback(); // Undo DB changes
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path); // Delete file

        logger.error('Upload error:', error);
        return res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
};

/**
 * Get call recordings for a device (Paginated)
 */
const getCallRecordings = async (req, res) => {
    try {
        const { deviceId } = req.params;
        const { startDate, endDate, type, page = 1, limit = 50 } = req.query;

        const offset = (page - 1) * limit;
        const where = { deviceId };

        // Add date filters if provided
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt[Op.gte] = new Date(startDate);
            if (endDate) where.createdAt[Op.lte] = new Date(endDate);
        }

        if (type) where.type = type;

        const { count, rows: recordings } = await CallRecording.findAndCountAll({
            where,
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset),
            include: [{ model: Device, attributes: ['id', 'deviceName'] }]
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
        logger.error('Fetch error:', error);
        return res.status(500).json({ success: false, error: 'Failed to fetch recordings' });
    }
};

/**
 * Delete call recordings (Database + Physical File)
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
            where: { id: recordingIds, deviceId }
        });

        if (recordings.length === 0) {
            return res.status(404).json({ success: false, error: 'No recordings found' });
        }

        // Physical deletion
        for (const rec of recordings) {
            if (rec.filePath && fs.existsSync(rec.filePath)) {
                fs.unlinkSync(rec.filePath);
            }
        }

        // Database deletion
        await CallRecording.destroy({ where: { id: recordingIds } });

        return res.json({ success: true, message: `Deleted ${recordings.length} recordings` });
    } catch (error) {
        logger.error('Delete error:', error);
        return res.status(500).json({ success: false, error: 'Failed to delete' });
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
    uploadRecording,
    getCallRecordings,
    getCallRecording,
    deleteCallRecordings,
    getCallRecordingStats
};
