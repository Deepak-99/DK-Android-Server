const { ScreenRecording, Device } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const {
    serverError,
    parsePagination,
    buildDateFilter,
    safeUnlink
} = require('../utils/controllerHelpers');

const streamHub = require("../services/streamHub");
const commandController = require("./commandController");




/* ------------------------------------------------------------------
 * Get screen recordings (list)
 * ------------------------------------------------------------------ */

const getScreenRecordings = async (req, res) => {
    try {
        const { deviceId } = req.params;
        const { startDate, endDate, page = 1, limit = 50 } = req.query;

        const { pageNum, limitNum, offset } = parsePagination(page, limit);

        const where = { deviceId };
        const dateFilter = buildDateFilter(startDate, endDate);
        if (dateFilter) where.createdAt = dateFilter;

        const { count, rows } = await ScreenRecording.findAndCountAll({
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
        return serverError(res, 'Failed to fetch screen recordings', error);
    }
};

/* ------------------------------------------------------------------
 * Get single screen recording
 * ------------------------------------------------------------------ */

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
        return serverError(res, 'Failed to fetch screen recording', error);
    }
};

/* ------------------------------------------------------------------
 * Delete screen recordings
 * ------------------------------------------------------------------ */

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
                id: { [Op.in]: recordingIds },
                deviceId
            }
        });

        if (recordings.length !== recordingIds.length) {
            return res.status(404).json({
                success: false,
                error: 'One or more recordings not found or access denied'
            });
        }

        recordings.forEach(r => {
            safeUnlink(r.filePath);
            safeUnlink(r.thumbnailPath);
        });

        await ScreenRecording.destroy({
            where: { id: { [Op.in]: recordingIds } }
        });

        return res.json({
            success: true,
            message: `${recordings.length} recording(s) deleted successfully`
        });

    } catch (error) {
        return serverError(res, 'Failed to delete screen recordings', error);
    }
};

/* ------------------------------------------------------------------
 * Screen recording statistics
 * ------------------------------------------------------------------ */

const getScreenRecordingStats = async (req, res) => {
    try {
        const { deviceId } = req.params;
        const { startDate, endDate } = req.query;

        const where = { deviceId };
        const dateFilter = buildDateFilter(startDate, endDate);
        if (dateFilter) where.createdAt = dateFilter;

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
                totalRecordings: Number(stats?.totalRecordings) || 0,
                totalDuration: Number(stats?.totalDuration) || 0,
                totalSize: Number(stats?.totalSize) || 0,
                avgDuration: Number(stats?.avgDuration) || 0
            }
        });

    } catch (error) {
        return serverError(res, 'Failed to get screen recording statistics', error);
    }
};

/* ------------------------------------------------------------------
 * Start screen recording
 * ------------------------------------------------------------------ */

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
            status: 'recording',
            quality: String(quality),
            resolution: String(resolution),
            bitRate: Number(bitRate),
            audioSource: String(audioSource),
            maxDuration: Number(maxDuration)
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

        /* start recording from stream */
        streamHub.startRecording(deviceId, recording.filePath);

        /* send command to device */
        await commandController.sendDeviceCommand(deviceId, {
            type: "SCREEN_RECORDING_START",
            data: { recordingId: recording.id }
        });

        return res.status(202).json({
            success: true,
            data: {
                recordingId: recording.id,
                status: recording.status
            }
        });

    } catch (error) {
        return serverError(res, 'Failed to start screen recording', error);
    }
};


/* ------------------------------------------------------------------ */
/* STOP SCREEN RECORDING */
/* ------------------------------------------------------------------ */

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

        /* stop streamHub recording */
        streamHub.stopRecording(recording.deviceId);

        await commandController.sendDeviceCommand(recording.deviceId, {
            type: "SCREEN_RECORDING_STOP",
            data: { recordingId }
        });

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
            message: 'Recording stopped'
        });

    } catch (error) {
        return serverError(res, 'Failed to stop screen recording', error);
    }
};

/* ------------------------------------------------------------------
 * Exports
 * ------------------------------------------------------------------ */

module.exports = {
    getScreenRecordings,
    getScreenRecording,
    deleteScreenRecordings,
    getScreenRecordingStats,
    startScreenRecording,
    stopScreenRecording
};
