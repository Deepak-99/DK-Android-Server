const express = require('express');
const { Op } = require('sequelize');

const db = require('../models');
const { Device, InstalledApp, AppLog, Command } = db;

const { authenticateToken, authenticateDevice, requireAdmin } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

/*
---------------------------------------
Device sends installed apps
---------------------------------------
*/
router.post('/installed', authenticateDevice, async (req, res) => {

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

    const apps = req.body.apps || [];

    const records = apps.map(app => ({
      device_id: device.id,
      package_name: app.package_name,
      app_name: app.app_name,
      version_name: app.version_name,
      version_code: app.version_code,
      is_system_app: app.is_system_app || false,
      is_enabled: app.is_enabled !== false
    }));

    await InstalledApp.bulkCreate(records, {
      updateOnDuplicate: [
        'version_name',
        'version_code',
        'is_enabled'
      ]
    });

    logger.info(`Apps synced from ${req.deviceId}`);

    res.json({
      success: true,
      count: records.length
    });

  } catch (error) {

    logger.error('Apps sync error', error);

    res.status(500).json({
      success: false,
      error: 'Server error'
    });

  }

});

/*
---------------------------------------
Admin open app
---------------------------------------
*/
router.post('/open', authenticateToken, requireAdmin, async (req, res) => {

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
      command_type: 'open_app',
      command_data: {
        package_name: req.body.package_name,
        activity_name: req.body.activity_name
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

    logger.error('Open app error', error);

    res.status(500).json({
      success: false,
      error: 'Server error'
    });

  }

});

module.exports = router;