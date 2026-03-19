const express = require('express');
const { body, validationResult, query } = require('express-validator');

const db = require('../models');
const { ScreenProjection, Device, Command } = db;

const logger = require('../utils/logger');

const router = express.Router();

/*
------------------------------------------------
Start projection
------------------------------------------------
*/
router.post('/start', async (req, res) => {

  try {

    const { device_id } = req.body;

    const device = await Device.findOne({
      where: { device_id }
    });

    if (!device) {
      return res.status(404).json({
        success: false
      });
    }

    const session_id = `proj_${Date.now()}`;

    const projection = await ScreenProjection.create({
      device_id: device.id,
      session_id,
      status: 'starting'
    });

    const command = await Command.create({
      device_id: device.id,
      command_type: 'StartScreenProjection',
      command_data: { session_id }
    });

    if (req.app.get('io')) {
      req.app.get('io').to(`device-${device.device_id}`).emit('new-command', command);
    }

    res.json({
      success: true,
      session_id
    });

  } catch (error) {

    logger.error('Screen projection start error', error);

    res.status(500).json({
      success: false
    });

  }

});

module.exports = router;