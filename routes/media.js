const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Op } = require('sequelize');
const { Device, MediaFile } = require('../config/database');
const { authenticateToken, authenticateDevice, requireAdmin } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Create uploads directory if it doesn't exist
const uploadsDir = 'uploads';
const mediaDir = path.join(uploadsDir, 'media');
const thumbnailsDir = path.join(uploadsDir, 'thumbnails');

[uploadsDir, mediaDir, thumbnailsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, mediaDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${req.deviceId}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 50 * 1024 * 1024, // 50MB default
  },
  fileFilter: (req, file, cb) => {
    // Allow images, videos, and audio files
    const allowedTypes = /jpeg|jpg|png|gif|mp4|avi|mov|mp3|wav|m4a/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only media files are allowed'));
    }
  }
});

// Upload media file (Device endpoint)
router.post('/upload', authenticateDevice, upload.single('media'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    const device = await Device.findOne({ where: { device_id: req.deviceId } });
    if (!device) {
      return res.status(404).json({
        success: false,
        error: 'Device not found'
      });
    }

    const {
      captured_at,
      location_latitude,
      location_longitude,
      duration,
      width,
      height,
      metadata
    } = req.body;

    // Determine media type
    let mediaType = 'other';
    if (req.file.mimetype.startsWith('image/')) {
      mediaType = 'image';
    } else if (req.file.mimetype.startsWith('video/')) {
      mediaType = 'video';
    } else if (req.file.mimetype.startsWith('audio/')) {
      mediaType = 'audio';
    }

    const mediaFile = await MediaFile.create({
      device_id: device.id,
      filename: req.file.filename,
      original_name: req.file.originalname,
      file_path: req.file.path,
      file_size: req.file.size,
      mime_type: req.file.mimetype,
      media_type: mediaType,
      duration: duration ? parseInt(duration) : null,
      width: width ? parseInt(width) : null,
      height: height ? parseInt(height) : null,
      captured_at: captured_at ? new Date(captured_at) : new Date(),
      location_latitude: location_latitude ? parseFloat(location_latitude) : null,
      location_longitude: location_longitude ? parseFloat(location_longitude) : null,
      upload_status: 'completed',
      upload_progress: 100,
      metadata: metadata ? JSON.parse(metadata) : null
    });

    logger.info(`Media file uploaded from device: ${req.deviceId}, file: ${req.file.originalname}`);

    // Emit to admin room
    if (req.io) {
      req.io.to('admin-room').emit('media-uploaded', {
        device_id: req.deviceId,
        media: mediaFile.toJSON()
      });
    }

    res.json({
      success: true,
      message: 'Media file uploaded successfully',
      data: {
        media_id: mediaFile.id,
        filename: mediaFile.filename,
        file_size: mediaFile.file_size
      }
    });
  } catch (error) {
    logger.error('Media upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Get media files for device (Admin only)
router.get('/device/:deviceId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, media_type, from, to } = req.query;
    const offset = (page - 1) * limit;

    const device = await Device.findByPk(req.params.deviceId);
    if (!device) {
      return res.status(404).json({
        success: false,
        error: 'Device not found'
      });
    }

    const whereClause = { device_id: device.id, is_deleted: false };
    
    if (media_type) {
      whereClause.media_type = media_type;
    }
    
    if (from || to) {
      whereClause.captured_at = {};
      if (from) whereClause.captured_at[Op.gte] = new Date(from);
      if (to) whereClause.captured_at[Op.lte] = new Date(to);
    }

    const { count, rows: mediaFiles } = await MediaFile.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['captured_at', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        media_files: mediaFiles,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(count / limit),
          total_count: count,
          per_page: parseInt(limit)
        }
      }
    });
  } catch (error) {
    logger.error('Get media files error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Download media file (Admin only)
router.get('/download/:mediaId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const mediaFile = await MediaFile.findByPk(req.params.mediaId);
    if (!mediaFile || mediaFile.is_deleted) {
      return res.status(404).json({
        success: false,
        error: 'Media file not found'
      });
    }

    if (!fs.existsSync(mediaFile.file_path)) {
      return res.status(404).json({
        success: false,
        error: 'File not found on disk'
      });
    }

    // Update download count and last accessed
    await mediaFile.update({
      download_count: mediaFile.download_count + 1,
      last_accessed: new Date()
    });

    res.setHeader('Content-Disposition', `attachment; filename="${mediaFile.original_name}"`);
    res.setHeader('Content-Type', mediaFile.mime_type);
    
    const fileStream = fs.createReadStream(mediaFile.file_path);
    fileStream.pipe(res);
  } catch (error) {
    logger.error('Download media file error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// View media file (Admin only)
router.get('/view/:mediaId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const mediaFile = await MediaFile.findByPk(req.params.mediaId);
    if (!mediaFile || mediaFile.is_deleted) {
      return res.status(404).json({
        success: false,
        error: 'Media file not found'
      });
    }

    if (!fs.existsSync(mediaFile.file_path)) {
      return res.status(404).json({
        success: false,
        error: 'File not found on disk'
      });
    }

    res.setHeader('Content-Type', mediaFile.mime_type);
    
    const fileStream = fs.createReadStream(mediaFile.file_path);
    fileStream.pipe(res);
  } catch (error) {
    logger.error('View media file error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Delete media file (Admin only)
router.delete('/:mediaId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const mediaFile = await MediaFile.findByPk(req.params.mediaId);
    if (!mediaFile) {
      return res.status(404).json({
        success: false,
        error: 'Media file not found'
      });
    }

    // Mark as deleted instead of actually deleting
    await mediaFile.update({ is_deleted: true });

    logger.info(`Media file deleted: ${mediaFile.filename}`);

    res.json({
      success: true,
      message: 'Media file deleted successfully'
    });
  } catch (error) {
    logger.error('Delete media file error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Get media statistics (Admin only)
router.get('/stats/device/:deviceId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const device = await Device.findByPk(req.params.deviceId);
    if (!device) {
      return res.status(404).json({
        success: false,
        error: 'Device not found'
      });
    }

    const stats = await MediaFile.findAll({
      where: { device_id: device.id, is_deleted: false },
      attributes: [
        'media_type',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('file_size')), 'total_size']
      ],
      group: ['media_type']
    });

    const totalFiles = await MediaFile.count({
      where: { device_id: device.id, is_deleted: false }
    });

    const totalSize = await MediaFile.sum('file_size', {
      where: { device_id: device.id, is_deleted: false }
    });

    res.json({
      success: true,
      data: {
        total_files: totalFiles,
        total_size: totalSize || 0,
        by_type: stats
      }
    });
  } catch (error) {
    logger.error('Get media stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

module.exports = router;
