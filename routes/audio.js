const express = require('express');
const { Op } = require('sequelize');

const db = require('../models');
const { Device, DeviceAudio, Command } = db;

const { authenticateToken, authenticateDevice, requireAdmin } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

/*
---------------------------------------
Device pushes audio status
---------------------------------------
*/
router.post('/status', authenticateDevice, async (req, res) => {

  try {

    const device = await Device.findOne({
      where: { device_id: req.deviceId }
    });

    if (!device) {
      return res.status(404).json({
        success: false,
        error: 'Device not found'
      });
    }

    const audio = await DeviceAudio.create({
      device_id: device.id,
      ...req.body
    });

    logger.info(`Audio status received from ${req.deviceId}`);

    // Emit to admin room
    if (req.io) {
      req.io.to('admin-room').emit('device-audio-updated', {
        device_id: req.deviceId
      });
    }

    res.json({
      success: true,
      id: audio.id
    });

  } catch (error) {

    logger.error('Audio status error', error);

    res.status(500).json({
      success: false,
      error: 'Server error'
    });

  }

});

/*
---------------------------------------
Admin set audio
---------------------------------------
*/
router.post('/set', authenticateToken, requireAdmin, async (req, res) => {

  try {

    const device = await Device.findByPk(req.body.device_id);

    if (!device) {
      return res.status(404).json({
        success: false,
        error: 'Device not found'
      });
    }

    const command = await Command.create({
      device_id: device.id,
      command_type: 'set_device_audio',
      command_data: req.body,
      created_by: req.user.id
    });

    // Emit to device room
    if (req.io) {
      req.io.to(`device-${device.device_id}`).emit('new-command', {
        command
      });
    }

    res.json({
      success: true,
      command_id: command.id
    });

  } catch (error) {

    logger.error('Audio set error', error);

    res.status(500).json({
      success: false,
      error: 'Server error'
    });

  }

});

module.exports = router;