const express = require('express');
const { Op } = require('sequelize');
const { Device, InstalledApp, AppLog } = require('../config/database');
const { authenticateToken, authenticateDevice, requireAdmin } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Submit installed apps list (Device endpoint)
router.post('/installed', authenticateDevice, async (req, res) => {
  try {
    const device = await Device.findOne({ where: { device_id: req.deviceId } });
    if (!device) {
      return res.status(404).json({
        success: false,
        error: 'Device not found'
      });
    }

    const { apps } = req.body;
    if (!Array.isArray(apps) || apps.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid apps data'
      });
    }

    const appData = apps.map(app => ({
      device_id: device.id,
      package_name: app.package_name,
      app_name: app.app_name,
      version_name: app.version_name,
      version_code: app.version_code,
      install_time: app.install_time ? new Date(app.install_time) : null,
      update_time: app.update_time ? new Date(app.update_time) : null,
      app_size: app.app_size,
      data_size: app.data_size,
      cache_size: app.cache_size,
      is_system_app: app.is_system_app || false,
      is_enabled: app.is_enabled !== false,
      permissions: app.permissions,
      activities: app.activities,
      services: app.services,
      receivers: app.receivers,
      icon_data: app.icon_data,
      target_sdk_version: app.target_sdk_version,
      min_sdk_version: app.min_sdk_version,
      installer_package: app.installer_package,
      sync_timestamp: new Date()
    }));

    // Use upsert to handle duplicates
    const createdApps = [];
    for (const appInfo of appData) {
      const [app, created] = await InstalledApp.findOrCreate({
        where: {
          device_id: device.id,
          package_name: appInfo.package_name
        },
        defaults: appInfo
      });

      if (!created) {
        await app.update(appInfo);
      }
      createdApps.push(app);
    }

    logger.info(`Installed apps data received from device: ${req.deviceId}, count: ${apps.length}`);

    // Emit to admin room
    if (req.io) {
      req.io.to('admin-room').emit('apps-updated', {
        device_id: req.deviceId,
        count: createdApps.length
      });
    }

    res.json({
      success: true,
      message: `${createdApps.length} apps processed successfully`,
      data: { count: createdApps.length }
    });
  } catch (error) {
    logger.error('Submit installed apps error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Submit app logs (Device endpoint)
router.post('/logs', authenticateDevice, async (req, res) => {
  try {
    const device = await Device.findOne({ where: { device_id: req.deviceId } });
    if (!device) {
      return res.status(404).json({
        success: false,
        error: 'Device not found'
      });
    }

    const { logs } = req.body;
    if (!Array.isArray(logs) || logs.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid logs data'
      });
    }

    const logData = logs.map(log => ({
      device_id: device.id,
      app_package: log.app_package,
      app_name: log.app_name,
      log_level: log.log_level,
      tag: log.tag,
      message: log.message,
      timestamp: log.timestamp ? new Date(log.timestamp) : new Date(),
      thread_id: log.thread_id,
      process_id: log.process_id,
      stack_trace: log.stack_trace,
      metadata: log.metadata
    }));

    const createdLogs = await AppLog.bulkCreate(logData);

    logger.info(`App logs received from device: ${req.deviceId}, count: ${logs.length}`);

    // Emit to admin room
    if (req.io) {
      req.io.to('admin-room').emit('app-logs-updated', {
        device_id: req.deviceId,
        count: createdLogs.length
      });
    }

    res.json({
      success: true,
      message: `${createdLogs.length} log entries processed successfully`,
      data: { count: createdLogs.length }
    });
  } catch (error) {
    logger.error('Submit app logs error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Get installed apps for device (Admin only)
router.get('/installed/device/:deviceId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50, search, is_system_app } = req.query;
    const offset = (page - 1) * limit;

    const device = await Device.findByPk(req.params.deviceId);
    if (!device) {
      return res.status(404).json({
        success: false,
        error: 'Device not found'
      });
    }

    const whereClause = { device_id: device.id, is_deleted: false };
    
    if (search) {
      whereClause[Op.or] = [
        { app_name: { [Op.like]: `%${search}%` } },
        { package_name: { [Op.like]: `%${search}%` } }
      ];
    }

    if (is_system_app !== undefined) {
      whereClause.is_system_app = is_system_app === 'true';
    }

    const { count, rows: apps } = await InstalledApp.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['app_name', 'ASC']]
    });

    res.json({
      success: true,
      data: {
        apps,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(count / limit),
          total_count: count,
          per_page: parseInt(limit)
        }
      }
    });
  } catch (error) {
    logger.error('Get installed apps error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Get app logs for device (Admin only)
router.get('/logs/device/:deviceId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 100, app_package, log_level, from, to } = req.query;
    const offset = (page - 1) * limit;

    const device = await Device.findByPk(req.params.deviceId);
    if (!device) {
      return res.status(404).json({
        success: false,
        error: 'Device not found'
      });
    }

    const whereClause = { device_id: device.id };
    
    if (app_package) {
      whereClause.app_package = app_package;
    }

    if (log_level) {
      whereClause.log_level = log_level;
    }

    if (from || to) {
      whereClause.timestamp = {};
      if (from) whereClause.timestamp[Op.gte] = new Date(from);
      if (to) whereClause.timestamp[Op.lte] = new Date(to);
    }

    const { count, rows: logs } = await AppLog.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['timestamp', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(count / limit),
          total_count: count,
          per_page: parseInt(limit)
        }
      }
    });
  } catch (error) {
    logger.error('Get app logs error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Open app on device (Admin command)
router.post('/open', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { device_id, package_name, activity_name } = req.body;

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
      command_type: 'open_app',
      command_data: {
        package_name,
        activity_name
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
      message: 'Open app command sent',
      data: { command_id: command.id }
    });
  } catch (error) {
    logger.error('Open app command error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Get app statistics (Admin only)
router.get('/stats/device/:deviceId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const device = await Device.findByPk(req.params.deviceId);
    if (!device) {
      return res.status(404).json({
        success: false,
        error: 'Device not found'
      });
    }

    const totalApps = await InstalledApp.count({
      where: { device_id: device.id, is_deleted: false }
    });

    const systemApps = await InstalledApp.count({
      where: { device_id: device.id, is_system_app: true, is_deleted: false }
    });

    const userApps = await InstalledApp.count({
      where: { device_id: device.id, is_system_app: false, is_deleted: false }
    });

    const totalLogs = await AppLog.count({
      where: { device_id: device.id }
    });

    const recentApps = await InstalledApp.findAll({
      where: { device_id: device.id, is_deleted: false },
      limit: 10,
      order: [['sync_timestamp', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        total_apps: totalApps,
        system_apps: systemApps,
        user_apps: userApps,
        total_logs: totalLogs,
        recent_apps: recentApps
      }
    });
  } catch (error) {
    logger.error('Get app stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

module.exports = router;
