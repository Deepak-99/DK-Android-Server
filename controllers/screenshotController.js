const { Screenshot, Device } = require('../../../models');
const { Op } = require('sequelize');
const logger = require('../../../utils/logger');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

/**
 * Get screenshots for a device
 */
const getScreenshots = async (req, res) => {
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

        const { count, rows: screenshots } = await Screenshot.findAndCountAll({
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
            data: screenshots,
            pagination: {
                total: count,
                page: parseInt(page),
                totalPages: Math.ceil(count / limit)
            }
        });

    } catch (error) {
        logger.error('Error fetching screenshots:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch screenshots',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Get a single screenshot by ID
 */
const getScreenshot = async (req, res) => {
    try {
        const { id } = req.params;

        const screenshot = await Screenshot.findByPk(id, {
            include: [{
                model: Device,
                attributes: ['id', 'deviceName']
            }]
        });

        if (!screenshot) {
            return res.status(404).json({
                success: false,
                error: 'Screenshot not found'
            });
        }

        // If the file exists, send it directly
        if (screenshot.filePath && fs.existsSync(screenshot.filePath)) {
            return res.sendFile(path.resolve(screenshot.filePath));
        }

        // If file doesn't exist, return the record without the file
        return res.json({
            success: true,
            data: {
                ...screenshot.toJSON(),
                fileExists: false
            }
        });

    } catch (error) {
        logger.error('Error fetching screenshot:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch screenshot'
        });
    }
};

/**
 * Delete screenshots
 */
const deleteScreenshots = async (req, res) => {
    try {
        const { deviceId } = req.params;
        const { screenshotIds = [] } = req.body;

        if (!Array.isArray(screenshotIds) || screenshotIds.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No screenshot IDs provided'
            });
        }

        // Verify all screenshots belong to the device
        const screenshots = await Screenshot.findAll({
            where: {
                id: screenshotIds,
                deviceId
            }
        });

        if (screenshots.length !== screenshotIds.length) {
            return res.status(404).json({
                success: false,
                error: 'One or more screenshots not found or access denied'
            });
        }

        // Delete files from storage
        for (const screenshot of screenshots) {
            if (screenshot.filePath && fs.existsSync(screenshot.filePath)) {
                fs.unlinkSync(screenshot.filePath);
            }
            
            // Delete thumbnail if exists
            if (screenshot.thumbnailPath && fs.existsSync(screenshot.thumbnailPath)) {
                fs.unlinkSync(screenshot.thumbnailPath);
            }
        }

        // Delete from database
        await Screenshot.destroy({
            where: {
                id: screenshotIds
            }
        });

        return res.json({
            success: true,
            message: `${screenshots.length} screenshot(s) deleted successfully`
        });

    } catch (error) {
        logger.error('Error deleting screenshots:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to delete screenshots'
        });
    }
};

/**
 * Get screenshot statistics
 */
const getScreenshotStats = async (req, res) => {
    try {
        const { deviceId } = req.params;
        const { startDate, endDate } = req.query;

        const where = { deviceId };
        
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt[Op.gte] = new Date(startDate);
            if (endDate) where.createdAt[Op.lte] = new Date(endDate);
        }

        const stats = await Screenshot.findOne({
            attributes: [
                [Screenshot.sequelize.fn('COUNT', Screenshot.sequelize.col('id')), 'totalScreenshots'],
                [Screenshot.sequelize.fn('SUM', Screenshot.sequelize.col('fileSize')), 'totalSize']
            ],
            where,
            raw: true
        });

        // Get screenshots by date (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const dailyStats = await Screenshot.findAll({
            attributes: [
                [Screenshot.sequelize.fn('DATE', Screenshot.sequelize.col('createdAt')), 'date'],
                [Screenshot.sequelize.fn('COUNT', Screenshot.sequelize.col('id')), 'count']
            ],
            where: {
                ...where,
                createdAt: { [Op.gte]: thirtyDaysAgo }
            },
            group: [Screenshot.sequelize.fn('DATE', Screenshot.sequelize.col('createdAt'))],
            raw: true,
            order: [['date', 'ASC']]
        });

        return res.json({
            success: true,
            data: {
                totalScreenshots: parseInt(stats.totalScreenshots) || 0,
                totalSize: parseInt(stats.totalSize) || 0,
                dailyStats: dailyStats.reduce((acc, { date, count }) => {
                    acc[date] = parseInt(count);
                    return acc;
                }, {})
            }
        });

    } catch (error) {
        logger.error('Error getting screenshot stats:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to get screenshot statistics'
        });
    }
};

/**
 * Take a new screenshot
 */
const takeScreenshot = async (req, res) => {
    try {
        const { deviceId } = req.params;
        const { 
            quality = 'high',
            width,
            height,
            delay = 0
        } = req.body;

        // Create a new screenshot record
        const screenshot = await Screenshot.create({
            id: uuidv4(),
            deviceId,
            status: 'pending',
            quality,
            width,
            height,
            delay
        });

        // TODO: Send command to device to take screenshot
        // await sendCommandToDevice(deviceId, 'TAKE_SCREENSHOT', {
        //     screenshotId: screenshot.id,
        //     quality,
        //     width,
        //     height,
        //     delay
        // });

        return res.status(202).json({
            success: true,
            data: {
                screenshotId: screenshot.id,
                status: 'pending'
            }
        });

    } catch (error) {
        logger.error('Error taking screenshot:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to take screenshot'
        });
    }
};

module.exports = {
    getScreenshots,
    getScreenshot,
    deleteScreenshots,
    getScreenshotStats,
    takeScreenshot
};
