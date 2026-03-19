// controllers/api/v1/fileController.js
const { CallRecording, ScreenRecording, Screenshot, Device } = require('../models');
const { deleteFile } = require('../utils/storage');
const fileAgent = require("../services/deviceFileAgent"); // Handles live device communication
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

class FileController {

    // --- SECTION 1: FORENSIC ASSET UPLOADS (From V1) ---
    // These save files to your server and create database records

    async uploadCallRecording(req, res) {
        try {
            if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' });

            const { deviceId } = req.params;
            const { callId, phoneNumber, duration, type } = req.body;

            const recording = await CallRecording.create({
                id: uuidv4(),
                deviceId,
                callId,
                phoneNumber,
                duration: parseInt(duration) || 0,
                type: type || 'incoming',
                filePath: req.file.path,
                fileSize: req.file.size,
                format: req.file.mimetype.split('/')[1] || 'mp3'
            });

            return res.status(201).json({ success: true, data: recording });
        } catch (error) {
            logger.error('Error uploading call recording:', error);
            return res.status(500).json({ success: false, error: 'Upload failed' });
        }
    }

    async uploadScreenshot(req, res) {
        try {
            if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' });

            const { deviceId } = req.params;
            const screenshot = await Screenshot.create({
                id: uuidv4(),
                deviceId,
                filePath: req.file.path,
                fileSize: req.file.size,
                width: parseInt(req.body.width) || 0,
                height: parseInt(req.body.height) || 0,
                format: req.file.mimetype.split('/')[1] || 'png'
            });

            return res.status(201).json({ success: true, data: screenshot });
        } catch (error) {
            logger.error('Error uploading screenshot:', error);
            return res.status(500).json({ success: false, error: 'Screenshot upload failed' });
        }
    }

    // --- SECTION 2: REMOTE EXPLORER (Ported from Old Controller) ---
    // These interact with the device's live file system

    async listRemoteFiles(req, res) {
        try {
            const { deviceId } = req.params;
            const remotePath = req.query.path || "/storage/emulated/0";

            // Talk to the device via the agent
            const result = await fileAgent.list(deviceId, remotePath);

            return res.json({
                success: true,
                path: remotePath,
                files: result // Expected: Array of { name, isDirectory, size, mtime }
            });
        } catch (error) {
            logger.error(`Remote list error for device ${req.params.deviceId}:`, error);
            return res.status(500).json({ success: false, error: "Could not contact device or path invalid" });
        }
    }

    async downloadFromDevice(req, res) {
        try {
            const { deviceId } = req.params;
            const remotePath = req.query.path;

            if (!remotePath) return res.status(400).json({ error: "Path is required" });

            const stream = await fileAgent.download(deviceId, remotePath);

            // Set headers to force download on the admin's browser
            res.setHeader('Content-Disposition', `attachment; filename=${path.basename(remotePath)}`);
            stream.pipe(res);
        } catch (error) {
            logger.error('Remote download error:', error);
            return res.status(500).json({ success: false, error: "Failed to pull file from device" });
        }
    }

    // --- SECTION 3: MAINTENANCE ---

    async deleteServerFile(req, res) {
        try {
            const { type, id } = req.params; // type: 'screenshot', 'call-recording', etc.
            const models = {
                'call-recording': CallRecording,
                'screen-recording': ScreenRecording,
                'screenshot': Screenshot
            };

            const model = models[type];
            if (!model) return res.status(400).json({ error: 'Invalid file type' });

            const record = await model.findByPk(id);
            if (!record) return res.status(404).json({ error: 'Record not found' });

            // 1. Delete physical file from server disk using storage utility
            if (record.filePath) {
                await deleteFile(record.filePath);
            }

            // 2. Delete database entry
            await record.destroy();

            return res.json({ success: true, message: 'File and record deleted' });
        } catch (error) {
            logger.error('Delete error:', error);
            return res.status(500).json({ success: false, error: 'Deletion failed' });
        }
    }
}

module.exports = new FileController();