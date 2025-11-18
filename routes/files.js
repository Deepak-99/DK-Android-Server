const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { Op } = require('sequelize');
const { Device, FileUpload } = require('../config/database');
const { authenticateToken, authenticateDevice, requireAdmin } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Create uploads directory if it doesn't exist
const uploadsDir = 'uploads';
const filesDir = path.join(uploadsDir, 'files');

[uploadsDir, filesDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, filesDir);
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
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 100 * 1024 * 1024, // 100MB default
  }
});

// Calculate file checksum
const calculateChecksum = (filePath) => {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    
    stream.on('error', reject);
    stream.on('data', chunk => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
  });
};

// Determine file type
const getFileType = (mimetype) => {
  if (mimetype.startsWith('image/')) return 'image';
  if (mimetype.startsWith('video/')) return 'video';
  if (mimetype.startsWith('audio/')) return 'audio';
  if (mimetype.includes('pdf') || mimetype.includes('document') || mimetype.includes('text')) return 'document';
  if (mimetype.includes('zip') || mimetype.includes('rar') || mimetype.includes('tar')) return 'archive';
  return 'other';
};

// Upload file (Device endpoint)
router.post('/upload', authenticateDevice, upload.single('file'), async (req, res) => {
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

    // Calculate checksum
    const checksum = await calculateChecksum(req.file.path);

    const { metadata, is_encrypted, encryption_key } = req.body;

    const fileUpload = await FileUpload.create({
      device_id: device.id,
      filename: req.file.filename,
      original_name: req.file.originalname,
      file_path: req.file.path,
      file_size: req.file.size,
      mime_type: req.file.mimetype,
      file_type: getFileType(req.file.mimetype),
      upload_status: 'completed',
      upload_progress: 100,
      checksum,
      metadata: metadata ? JSON.parse(metadata) : null,
      is_encrypted: is_encrypted === 'true',
      encryption_key: encryption_key || null
    });

    logger.info(`File uploaded from device: ${req.deviceId}, file: ${req.file.originalname}`);

    // Emit to admin room
    if (req.io) {
      req.io.to('admin-room').emit('file-uploaded', {
        device_id: req.deviceId,
        file: fileUpload.toJSON()
      });
    }

    res.json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        file_id: fileUpload.id,
        filename: fileUpload.filename,
        file_size: fileUpload.file_size,
        checksum: fileUpload.checksum
      }
    });
  } catch (error) {
    logger.error('File upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Get files for device (Admin only)
router.get('/device/:deviceId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, file_type, from, to } = req.query;
    const offset = (page - 1) * limit;

    const device = await Device.findByPk(req.params.deviceId);
    if (!device) {
      return res.status(404).json({
        success: false,
        error: 'Device not found'
      });
    }

    const whereClause = { device_id: device.id, is_deleted: false };
    
    if (file_type) {
      whereClause.file_type = file_type;
    }
    
    if (from || to) {
      whereClause.created_at = {};
      if (from) whereClause.created_at[Op.gte] = new Date(from);
      if (to) whereClause.created_at[Op.lte] = new Date(to);
    }

    const { count, rows: files } = await FileUpload.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        files,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(count / limit),
          total_count: count,
          per_page: parseInt(limit)
        }
      }
    });
  } catch (error) {
    logger.error('Get files error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Download file (Admin only)
router.get('/download/:fileId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const file = await FileUpload.findByPk(req.params.fileId);
    if (!file || file.is_deleted) {
      return res.status(404).json({
        success: false,
        error: 'File not found'
      });
    }

    if (!fs.existsSync(file.file_path)) {
      return res.status(404).json({
        success: false,
        error: 'File not found on disk'
      });
    }

    // Update download count and last accessed
    await file.update({
      download_count: file.download_count + 1,
      last_accessed: new Date()
    });

    res.setHeader('Content-Disposition', `attachment; filename="${file.original_name}"`);
    res.setHeader('Content-Type', file.mime_type);
    res.setHeader('Content-Length', file.file_size);
    
    const fileStream = fs.createReadStream(file.file_path);
    fileStream.pipe(res);
  } catch (error) {
    logger.error('Download file error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Delete file (Admin only)
router.delete('/:fileId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const file = await FileUpload.findByPk(req.params.fileId);
    if (!file) {
      return res.status(404).json({
        success: false,
        error: 'File not found'
      });
    }

    // Mark as deleted instead of actually deleting
    await file.update({ is_deleted: true });

    logger.info(`File deleted: ${file.filename}`);

    res.json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    logger.error('Delete file error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Get file statistics (Admin only)
router.get('/stats/device/:deviceId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const device = await Device.findByPk(req.params.deviceId);
    if (!device) {
      return res.status(404).json({
        success: false,
        error: 'Device not found'
      });
    }

    const stats = await FileUpload.findAll({
      where: { device_id: device.id, is_deleted: false },
      attributes: [
        'file_type',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('file_size')), 'total_size']
      ],
      group: ['file_type']
    });

    const totalFiles = await FileUpload.count({
      where: { device_id: device.id, is_deleted: false }
    });

    const totalSize = await FileUpload.sum('file_size', {
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
    logger.error('Get file stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

module.exports = router;
