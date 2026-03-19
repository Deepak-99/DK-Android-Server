const express = require('express');
const { Op } = require('sequelize');

const db = require('../models');
const { Device, DynamicConfig, Command } = db;

const { authenticateToken, authenticateDevice, requireAdmin } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

/*
---------------------------------------
Push config from device
---------------------------------------
*/
router.post('/push', authenticateDevice, async (req, res) => {
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

    const { configs } = req.body;

    if (!Array.isArray(configs) || configs.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid config data'
      });
    }

    const processed = [];

    for (const config of configs) {

      const [record, created] = await DynamicConfig.findOrCreate({
        where: {
          device_id: device.id,
          config_key: config.config_key
        },
        defaults: {
          device_id: device.id,
          config_key: config.config_key,
          config_value: config.config_value,
          config_type: config.config_type || 'string',
          category: config.category,
          description: config.description,
          is_sensitive: config.is_sensitive || false,
          is_readonly: config.is_readonly || false,
          default_value: config.default_value,
          validation_rules: config.validation_rules,
          version: config.version || 1,
          is_active: config.is_active !== false
        }
      });

      if (!created) {
        await record.update(config);
      }

      processed.push(record);
    }

    logger.info(`Dynamic configs received from ${req.deviceId}`);

    // Emit to admin room
    if (req.io) {
      req.io.to('admin-room').emit('config-updated', {
        device_id: req.deviceId,
        count: processed.length
      });
    }

    res.json({
      success: true,
      count: processed.length
    });

  } catch (error) {
    logger.error('Config push error', error);

    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

/*
---------------------------------------
Admin set config
---------------------------------------
*/
router.post('/set', authenticateToken, requireAdmin, async (req, res) => {

  try {

    const {
      device_id,
      config_key,
      config_value,
      config_type
    } = req.body;

    const device = await Device.findByPk(device_id);

    if (!device) {
      return res.status(404).json({
        success: false,
        error: 'Device not found'
      });
    }

    const command = await Command.create({
      device_id: device.id,
      command_type: 'set_dynamic_config',
      command_data: {
        config_key,
        config_value,
        config_type: config_type || 'string'
      },
      created_by: req.user.id
    });

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

    logger.error('Set config error', error);

    res.status(500).json({
      success: false,
      error: 'Server error'
    });

  }
});

module.exports = router;