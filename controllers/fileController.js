// controllers/api/v1/fileController.js
const { CallRecording, ScreenRecording, Screenshot } = require('../../../models');
const { getFilePath, deleteFile } = require('../../../utils/storage');
const logger = require('../../../utils/logger');

class FileController {
    // Upload call recording
    async uploadCallRecording(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    error: 'No file uploaded'
                });
            }

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

            return res.status(201).json({
                success: true,
                data: recording
            });
        } catch (error) {
            logger.error('Error uploading call recording:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to upload call recording'
            });
        }
    }

    // Upload screen recording
    async uploadScreenRecording(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    error: 'No file uploaded'
                });
            }

            const { deviceId } = req.params;
            const { duration, resolution, bitRate } = req.body;

            const recording = await ScreenRecording.create({
                id: uuidv4(),
                deviceId,
                filePath: req.file.path,
                fileSize: req.file.size,
                duration: parseInt(duration) || 0,
                resolution: resolution || '720p',
                bitRate: parseInt(bitRate) || 4000000,
                status: 'completed'
            });

            return res.status(201).json({
                success: true,
                data: recording
            });
        } catch (error) {
            logger.error('Error uploading screen recording:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to upload screen recording'
            });
        }
    }

    // Upload screenshot
    async uploadScreenshot(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    error: 'No file uploaded'
                });
            }

            const { deviceId } = req.params;
            const { width, height } = req.body;

            const screenshot = await Screenshot.create({
                id: uuidv4(),
                deviceId,
                filePath: req.file.path,
                fileSize: req.file.size,
                width: parseInt(width) || 0,
                height: parseInt(height) || 0,
                format: req.file.mimetype.split('/')[1] || 'png'
            });

            return res.status(201).json({
                success: true,
                data: screenshot
            });
        } catch (error) {
            logger.error('Error uploading screenshot:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to upload screenshot'
            });
        }
    }

    // Delete file
    async deleteFile(req, res) {
        try {
            const { type, id } = req.params;

            let model;
            switch (type) {
                case 'call-recording':
                    model = CallRecording;
                    break;
                case 'screen-recording':
                    model = ScreenRecording;
                    break;
                case 'screenshot':
                    model = Screenshot;
                    break;
                default:
                    return res.status(400).json({
                        success: false,
                        error: 'Invalid file type'
                    });
            }

            const file = await model.findByPk(id);
            if (!file) {
                return res.status(404).json({
                    success: false,
                    error: 'File not found'
                });
            }

            // Delete file from storage
            if (file.filePath) {
                await deleteFile(file.filePath);
            }

            // Delete record from database
            await file.destroy();

            return res.json({
                success: true,
                message: 'File deleted successfully'
            });
        } catch (error) {
            logger.error('Error deleting file:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to delete file'
            });
        }
    }
}

module.exports = new FileController();