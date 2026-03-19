const { Screenshot, Device } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const {
    serverError,
    parsePagination,
    buildDateFilter,
    safeUnlink
} = require('../utils/controllerHelpers');



/* ------------------------------------------------------------------
 * Get screenshots (list)
 * ------------------------------------------------------------------ */

const getScreenshots = async (req, res) => {
    try {
        const { deviceId } = req.params;
        const { startDate, endDate, page = 1, limit = 50 } = req.query;

        const { pageNum, limitNum, offset } = parsePagination(page, limit);

        const where = { deviceId };
        const dateFilter = buildDateFilter(startDate, endDate);
        if (dateFilter) where.createdAt = dateFilter;

        const { count, rows } = await Screenshot.findAndCountAll({
            where,
            order: [['createdAt', 'DESC']],
            limit: limitNum,
            offset,
            include: [{
                model: Device,
                attributes: ['id', 'deviceName']
            }]
        });

        return res.json({
            success: true,
            data: rows,
            pagination: {
                total: count,
                page: pageNum,
                totalPages: Math.ceil(count / limitNum)
            }
        });

    } catch (error) {
        return serverError(res, 'Failed to fetch screenshots', error);
    }
};

/* ------------------------------------------------------------------
 * Get single screenshot
 * ------------------------------------------------------------------ */

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
        return serverError(res, 'Failed to fetch screenshot', error);
    }
};

/* ------------------------------------------------------------------
 * Delete screenshots
 * ------------------------------------------------------------------ */

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
                id: { [Op.in]: screenshotIds },
                deviceId
            }
        });

        if (screenshots.length !== screenshotIds.length) {
            return res.status(404).json({
                success: false,
                error: 'One or more screenshots not found or access denied'
            });
        }

        screenshots.forEach(s => {
            safeUnlink(s.filePath);
            safeUnlink(s.thumbnailPath);
        });

        await Screenshot.destroy({
            where: { id: { [Op.in]: screenshotIds } }
        });

        return res.json({
            success: true,
            message: `${screenshots.length} screenshot(s) deleted successfully`
        });

    } catch (error) {
        return serverError(res, 'Failed to delete screenshots', error);
    }
};

/* ------------------------------------------------------------------
 * Screenshot statistics
 * ------------------------------------------------------------------ */

const getScreenshotStats = async (req, res) => {
    try {
        const { deviceId } = req.params;
        const { startDate, endDate } = req.query;

        const where = { deviceId };
        const dateFilter = buildDateFilter(startDate, endDate);
        if (dateFilter) where.createdAt = dateFilter;

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
                deviceId,
                createdAt: { [Op.gte]: thirtyDaysAgo }
            },
            group: [Screenshot.sequelize.fn('DATE', Screenshot.sequelize.col('createdAt'))],
            order: [['date', 'ASC']],
            raw: true
        });

        return res.json({
            success: true,
            data: {
                totalScreenshots: Number(stats?.totalScreenshots) || 0,
                totalSize: Number(stats?.totalSize) || 0,
                dailyStats: dailyStats.reduce((acc, { date, count }) => {
                    acc[date] = Number(count);
                    return acc;
                }, {})
            }
        });

    } catch (error) {
        return serverError(res, 'Failed to get screenshot statistics', error);
    }
};

/* ------------------------------------------------------------------
 * Take screenshot
 * ------------------------------------------------------------------ */

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
            quality: String(quality),
            width: width != null ? Number(width) : null,
            height: height != null ? Number(height) : null,
            delay: Number(delay)
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
                status: screenshot.status
            }
        });

    } catch (error) {
        return serverError(res, 'Failed to take screenshot', error);
    }
};

/* ------------------------------------------------------------------
 * Exports
 * ------------------------------------------------------------------ */

module.exports = {
    getScreenshots,
    getScreenshot,
    deleteScreenshots,
    getScreenshotStats,
    takeScreenshot
};
