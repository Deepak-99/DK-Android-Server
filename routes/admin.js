const express = require('express');
const { Op } = require('sequelize');

const db = require('../models');
const { Device, User, Command } = db;

const { authenticateToken, requireAdmin } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

/*
------------------------------------------------
Send command to device (Admin)
------------------------------------------------
*/
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

    logger.info(`Command sent to ${device.device_id}`);

    // Emit to device room
    if (req.io) {
      req.io.to(`device-${device.device_id}`).emit('new-command', {
        command
      });
    }

    res.json({
      success: true,
      command
    });

  } catch (error) {

    logger.error('Admin command error', error);

    res.status(500).json({
      success: false,
      error: 'Server error'
    });

  }

});

/*
------------------------------------------------
Device fetch pending commands
------------------------------------------------
*/
router.get('/commands/pending', async (req, res) => {

  try {

    const deviceId = req.headers['x-device-id'];

    if (!deviceId) {
      return res.status(400).json({
        success: false,
        error: 'Device ID required'
      });
    }

    const device = await Device.findOne({
      where: { device_id: deviceId }
    });

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
          id: { [Op.in]: commands.map(c => c.id) },
          status: 'pending'
        }
      }
    );

    res.json({
      success: true,
      commands
    });

  } catch (error) {

    logger.error('Pending commands error', error);

    res.status(500).json({
      success: false,
      error: 'Server error'
    });

  }

});

/*
------------------------------------------------
Update command status (device)
------------------------------------------------
*/
router.post('/commands/:commandId/status', async (req, res) => {

  try {

    const { status, response_data, error_message } = req.body;

    const command = await Command.findByPk(req.params.commandId);

    if (!command) {
      return res.status(404).json({
        success: false,
        error: 'Command not found'
      });
    }

    const update = { status };

    if (status === 'completed') {
      update.completed_at = new Date();
      update.response_data = response_data;
    }

    if (status === 'failed') {
      update.error_message = error_message;
    }

    await command.update(update);

    res.json({
      success: true
    });

  } catch (error) {

    logger.error('Command status update error', error);

    res.status(500).json({
      success: false,
      error: 'Server error'
    });

  }

});

module.exports = router;