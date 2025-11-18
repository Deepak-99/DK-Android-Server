const express = require('express');
const { Op } = require('sequelize');
const { Device, User, Command } = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Send command to device (Admin only)
router.post('/command', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      device_id,
      command_type,
      command_data,
      priority = 'normal',
      expires_in_minutes = 60
    } = req.body;

    const device = await Device.findByPk(device_id);
    if (!device) {
      return res.status(404).json({
        success: false,
        error: 'Device not found'
      });
    }

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + expires_in_minutes);

    const command = await Command.create({
      device_id: device.id,
      command_type,
      command_data,
      priority,
      created_by: req.user.id,
      expires_at: expiresAt
    });

    logger.info(`Command sent to device: ${device.device_id}, type: ${command_type}`);

    // Emit to device room
    if (req.io) {
      req.io.to(`device-${device.device_id}`).emit('new-command', {
        command: command.toJSON()
      });
    }

    res.json({
      success: true,
      message: 'Command sent successfully',
      data: { command }
    });
  } catch (error) {
    logger.error('Send command error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Get pending commands for device (Device endpoint)
router.get('/commands/pending', async (req, res) => {
  try {
    const deviceId = req.headers['x-device-id'];
    if (!deviceId) {
      return res.status(400).json({
        success: false,
        error: 'Device ID required'
      });
    }

    const device = await Device.findOne({ where: { device_id: deviceId } });
    if (!device) {
      return res.status(404).json({
        success: false,
        error: 'Device not found'
      });
    }

    const commands = await Command.findAll({
      where: {
        device_id: device.id,
        status: ['pending', 'sent'],
        expires_at: { [Op.gt]: new Date() }
      },
      order: [['priority', 'DESC'], ['created_at', 'ASC']]
    });

    // Mark commands as sent
    await Command.update(
      { status: 'sent', sent_at: new Date() },
      {
        where: {
          id: { [Op.in]: commands.map(cmd => cmd.id) },
          status: 'pending'
        }
      }
    );

    res.json({
      success: true,
      data: { commands }
    });
  } catch (error) {
    logger.error('Get pending commands error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Update command status (Device endpoint)
router.post('/commands/:commandId/status', async (req, res) => {
  try {
    const { status, response_data, error_message } = req.body;
    const deviceId = req.headers['x-device-id'];

    const command = await Command.findByPk(req.params.commandId);
    if (!command) {
      return res.status(404).json({
        success: false,
        error: 'Command not found'
      });
    }

    const updates = { status };
    
    if (status === 'acknowledged') {
      updates.acknowledged_at = new Date();
    } else if (status === 'completed') {
      updates.completed_at = new Date();
      updates.response_data = response_data;
    } else if (status === 'failed') {
      updates.error_message = error_message;
    }

    await command.update(updates);

    logger.info(`Command status updated: ${command.id}, status: ${status}`);

    // Emit to admin room
    if (req.io) {
      req.io.to('admin-room').emit('command-status-updated', {
        command_id: command.id,
        device_id: deviceId,
        status,
        response_data,
        error_message
      });
    }

    res.json({
      success: true,
      message: 'Command status updated'
    });
  } catch (error) {
    logger.error('Update command status error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Get system statistics (Admin only)
router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const totalDevices = await Device.count();
    const onlineDevices = await Device.count({ where: { status: 'online' } });
    const offlineDevices = await Device.count({ where: { status: 'offline' } });
    
    const recentDevices = await Device.findAll({
      limit: 5,
      order: [['last_seen', 'DESC']],
      attributes: ['id', 'device_id', 'device_name', 'status', 'last_seen']
    });

    const pendingCommands = await Command.count({
      where: {
        status: ['pending', 'sent'],
        expires_at: { [Op.gt]: new Date() }
      }
    });

    res.json({
      success: true,
      data: {
        devices: {
          total: totalDevices,
          online: onlineDevices,
          offline: offlineDevices
        },
        recent_devices: recentDevices,
        pending_commands: pendingCommands
      }
    });
  } catch (error) {
    logger.error('Get admin stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Create admin user (Super admin only - for initial setup)
router.post('/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { username, email, password, role = 'admin' } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ email }, { username }]
      }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User already exists'
      });
    }

    const user = await User.create({
      username,
      email,
      password,
      role
    });

    logger.info(`Admin user created: ${email}`);

    res.json({
      success: true,
      message: 'User created successfully',
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        }
      }
    });
  } catch (error) {
    logger.error('Create admin user error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Get system logs (Admin only)
router.get('/logs', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { lines = 100 } = req.query;
    const fs = require('fs');
    const path = require('path');
    
    const logFile = path.join('logs', 'combined.log');
    
    if (!fs.existsSync(logFile)) {
      return res.json({
        success: true,
        data: { logs: [] }
      });
    }

    const logs = fs.readFileSync(logFile, 'utf8')
      .split('\n')
      .filter(line => line.trim())
      .slice(-parseInt(lines))
      .map(line => {
        try {
          return JSON.parse(line);
        } catch {
          return { message: line, timestamp: new Date().toISOString() };
        }
      });

    res.json({
      success: true,
      data: { logs }
    });
  } catch (error) {
    logger.error('Get logs error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

module.exports = router;
