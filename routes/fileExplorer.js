const express = require('express');
const { Op } = require('sequelize');

const db = require('../models');
const { Device, FileExplorer, Command } = db;

const { authenticateToken, authenticateDevice, requireAdmin } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

/*
----------------------------------------
Submit directory walk
----------------------------------------
*/
router.post('/walk', authenticateDevice, async (req, res) => {

  try {

    const device = await Device.findOne({
      where: { device_id: req.deviceId }
    });

    if (!device) {
      return res.status(404).json({ success: false });
    }

    const { files } = req.body;

    const data = files.map(file => ({
      device_id: device.id,
      ...file,
      scan_timestamp: new Date()
    }));

    await FileExplorer.bulkCreate(data, {
      updateOnDuplicate: [
        'file_size',
        'last_modified',
        'permissions',
        'scan_timestamp'
      ]
    });

    res.json({
      success: true,
      count: data.length
    });

  } catch (err) {

    logger.error('File explorer walk error', err);

    res.status(500).json({ success: false });

  }

});


/*
----------------------------------------
Admin browse files
----------------------------------------
*/
router.get('/device/:deviceId', authenticateToken, requireAdmin, async (req, res) => {

  try {

    const { page = 1, limit = 100 } = req.query;

    const offset = (page - 1) * limit;

    const { count, rows } = await FileExplorer.findAndCountAll({
      where: { device_id: req.params.deviceId },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['file_name', 'ASC']]
    });

    res.json({
      success: true,
      files: rows,
      total: count
    });

  } catch (err) {

    logger.error('File explorer fetch error', err);

    res.status(500).json({ success: false });

  }

});


/*
----------------------------------------
Delete file (command)
----------------------------------------
*/
router.delete('/delete', authenticateToken, requireAdmin, async (req, res) => {

  try {

    const device = await Device.findByPk(req.body.device_id);

    if (!device) {
      return res.status(404).json({ success: false });
    }

    const command = await Command.create({
      device_id: device.id,
      command_type: 'delete_file',
      command_data: {
        file_path: req.body.file_path
      }
    });

    if (req.io) {
      req.io.to(`device-${device.device_id}`).emit('new-command', command);
    }

    res.json({
      success: true
    });

  } catch (err) {

    logger.error('File delete command error', err);

    res.status(500).json({ success: false });

  }

});

module.exports = router;