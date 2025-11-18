const express = require('express');
const { Op } = require('sequelize');
const { Device, FileExplorer } = require('../config/database');
const { authenticateToken, authenticateDevice, requireAdmin } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Submit file explorer data (Device endpoint)
router.post('/walk', authenticateDevice, async (req, res) => {
  try {
    const device = await Device.findOne({ where: { device_id: req.deviceId } });
    if (!device) {
      return res.status(404).json({
        success: false,
        error: 'Device not found'
      });
    }

    const { files, directory_path } = req.body;
    if (!Array.isArray(files) || files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid files data'
      });
    }

    const fileData = files.map(file => ({
      device_id: device.id,
      file_path: file.file_path,
      file_name: file.file_name,
      parent_path: file.parent_path || directory_path,
      file_type: file.file_type,
      file_size: file.file_size,
      mime_type: file.mime_type,
      last_modified: file.last_modified ? new Date(file.last_modified) : null,
      permissions: file.permissions,
      owner: file.owner,
      group: file.group,
      is_hidden: file.is_hidden || false,
      is_readable: file.is_readable !== false,
      is_writable: file.is_writable || false,
      is_executable: file.is_executable || false,
      thumbnail_path: file.thumbnail_path,
      metadata: file.metadata,
      scan_timestamp: new Date()
    }));

    // Use upsert to handle duplicates
    const createdFiles = [];
    for (const fileInfo of fileData) {
      const [file, created] = await FileExplorer.findOrCreate({
        where: {
          device_id: device.id,
          file_path: fileInfo.file_path
        },
        defaults: fileInfo
      });

      if (!created) {
        await file.update(fileInfo);
      }
      createdFiles.push(file);
    }

    logger.info(`File explorer data received from device: ${req.deviceId}, directory: ${directory_path}, count: ${files.length}`);

    // Emit to admin room
    if (req.io) {
      req.io.to('admin-room').emit('file-explorer-updated', {
        device_id: req.deviceId,
        directory_path,
        count: createdFiles.length
      });
    }

    res.json({
      success: true,
      message: `${createdFiles.length} files processed successfully`,
      data: { count: createdFiles.length }
    });
  } catch (error) {
    logger.error('Submit file explorer data error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Submit thumbnails (Device endpoint)
router.post('/thumbnails', authenticateDevice, async (req, res) => {
  try {
    const device = await Device.findOne({ where: { device_id: req.deviceId } });
    if (!device) {
      return res.status(404).json({
        success: false,
        error: 'Device not found'
      });
    }

    const { thumbnails } = req.body;
    if (!Array.isArray(thumbnails) || thumbnails.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid thumbnails data'
      });
    }

    let updatedCount = 0;
    for (const thumb of thumbnails) {
      const updated = await FileExplorer.update(
        { thumbnail_path: thumb.thumbnail_path },
        {
          where: {
            device_id: device.id,
            file_path: thumb.file_path
          }
        }
      );
      if (updated[0] > 0) updatedCount++;
    }

    logger.info(`Thumbnails received from device: ${req.deviceId}, count: ${thumbnails.length}`);

    res.json({
      success: true,
      message: `${updatedCount} thumbnails processed successfully`,
      data: { count: updatedCount }
    });
  } catch (error) {
    logger.error('Submit thumbnails error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Get file explorer data for device (Admin only)
router.get('/device/:deviceId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 100, path, file_type, search } = req.query;
    const offset = (page - 1) * limit;

    const device = await Device.findByPk(req.params.deviceId);
    if (!device) {
      return res.status(404).json({
        success: false,
        error: 'Device not found'
      });
    }

    const whereClause = { device_id: device.id, is_deleted: false };
    
    if (path) {
      whereClause.parent_path = path;
    }

    if (file_type) {
      whereClause.file_type = file_type;
    }

    if (search) {
      whereClause.file_name = { [Op.like]: `%${search}%` };
    }

    const { count, rows: files } = await FileExplorer.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['file_type', 'ASC'], ['file_name', 'ASC']]
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
    logger.error('Get file explorer data error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Delete file on device (Admin command)
router.delete('/delete', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { device_id, file_path } = req.body;

    const device = await Device.findByPk(device_id);
    if (!device) {
      return res.status(404).json({
        success: false,
        error: 'Device not found'
      });
    }

    const Command = require('../config/database').Command;
    const command = await Command.create({
      device_id: device.id,
      command_type: 'delete_file',
      command_data: {
        file_path
      },
      priority: 'normal',
      created_by: req.user.id,
      expires_at: new Date(Date.now() + 60 * 60 * 1000) // 1 hour
    });

    // Emit to device room
    if (req.io) {
      req.io.to(`device-${device.device_id}`).emit('new-command', {
        command: command.toJSON()
      });
    }

    res.json({
      success: true,
      message: 'Delete file command sent',
      data: { command_id: command.id }
    });
  } catch (error) {
    logger.error('Delete file command error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Request file push from device (Admin command)
router.post('/push', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { device_id, file_paths, destination_path } = req.body;

    const device = await Device.findByPk(device_id);
    if (!device) {
      return res.status(404).json({
        success: false,
        error: 'Device not found'
      });
    }

    const Command = require('../config/database').Command;
    const command = await Command.create({
      device_id: device.id,
      command_type: Array.isArray(file_paths) && file_paths.length > 1 ? 'push_files' : 'push_file',
      command_data: {
        file_paths: Array.isArray(file_paths) ? file_paths : [file_paths],
        destination_path
      },
      priority: 'normal',
      created_by: req.user.id,
      expires_at: new Date(Date.now() + 60 * 60 * 1000) // 1 hour
    });

    // Emit to device room
    if (req.io) {
      req.io.to(`device-${device.device_id}`).emit('new-command', {
        command: command.toJSON()
      });
    }

    res.json({
      success: true,
      message: 'Push file command sent',
      data: { command_id: command.id }
    });
  } catch (error) {
    logger.error('Push file command error:', error);
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

    const totalFiles = await FileExplorer.count({
      where: { device_id: device.id, file_type: 'file', is_deleted: false }
    });

    const totalDirectories = await FileExplorer.count({
      where: { device_id: device.id, file_type: 'directory', is_deleted: false }
    });

    const totalSize = await FileExplorer.sum('file_size', {
      where: { device_id: device.id, file_type: 'file', is_deleted: false }
    });

    const fileTypes = await FileExplorer.findAll({
      attributes: [
        'mime_type',
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
      ],
      where: { device_id: device.id, file_type: 'file', is_deleted: false },
      group: ['mime_type'],
      order: [[require('sequelize').literal('count'), 'DESC']],
      limit: 10
    });

    const recentFiles = await FileExplorer.findAll({
      where: { device_id: device.id, file_type: 'file', is_deleted: false },
      limit: 10,
      order: [['scan_timestamp', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        total_files: totalFiles,
        total_directories: totalDirectories,
        total_size: totalSize || 0,
        file_types: fileTypes,
        recent_files: recentFiles
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
