const express = require('express');
const { Op } = require('sequelize');
const { Device, SMS } = require('../config/database');
const { authenticateToken, authenticateDevice, requireAdmin } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Submit SMS data (Device endpoint)
router.post('/', authenticateDevice, async (req, res) => {
  try {
    const device = await Device.findOne({ where: { device_id: req.deviceId } });
    if (!device) {
      return res.status(404).json({
        success: false,
        error: 'Device not found'
      });
    }

    const { sms_messages } = req.body;
    if (!Array.isArray(sms_messages) || sms_messages.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid SMS data'
      });
    }

    const smsData = sms_messages.map(sms => ({
      device_id: device.id,
      sms_id: sms.sms_id,
      thread_id: sms.thread_id,
      address: sms.address,
      person: sms.person,
      date: new Date(sms.date),
      date_sent: sms.date_sent ? new Date(sms.date_sent) : null,
      protocol: sms.protocol,
      read: sms.read || false,
      status: sms.status,
      type: sms.type,
      reply_path_present: sms.reply_path_present || false,
      subject: sms.subject,
      body: sms.body,
      service_center: sms.service_center,
      locked: sms.locked || false,
      error_code: sms.error_code,
      seen: sms.seen || false,
      sync_timestamp: new Date()
    }));

    // Use upsert to handle duplicates
    const createdSMS = [];
    for (const smsInfo of smsData) {
      const [sms, created] = await SMS.findOrCreate({
        where: {
          device_id: device.id,
          sms_id: smsInfo.sms_id
        },
        defaults: smsInfo
      });

      if (!created) {
        await sms.update(smsInfo);
      }
      createdSMS.push(sms);
    }

    logger.info(`SMS data received from device: ${req.deviceId}, count: ${sms_messages.length}`);

    // Emit to admin room
    if (req.io) {
      req.io.to('admin-room').emit('sms-updated', {
        device_id: req.deviceId,
        count: createdSMS.length
      });
    }

    res.json({
      success: true,
      message: `${createdSMS.length} SMS messages processed successfully`,
      data: { count: createdSMS.length }
    });
  } catch (error) {
    logger.error('Submit SMS error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Get SMS messages for device (Admin only)
router.get('/device/:deviceId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50, type, search, thread_id } = req.query;
    const offset = (page - 1) * limit;

    const device = await Device.findByPk(req.params.deviceId);
    if (!device) {
      return res.status(404).json({
        success: false,
        error: 'Device not found'
      });
    }

    const whereClause = { device_id: device.id, is_deleted: false };
    
    if (type) {
      whereClause.type = type;
    }
    
    if (thread_id) {
      whereClause.thread_id = thread_id;
    }
    
    if (search) {
      whereClause[Op.or] = [
        { address: { [Op.like]: `%${search}%` } },
        { body: { [Op.like]: `%${search}%` } },
        { subject: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows: smsMessages } = await SMS.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['date', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        sms_messages: smsMessages,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(count / limit),
          total_count: count,
          per_page: parseInt(limit)
        }
      }
    });
  } catch (error) {
    logger.error('Get SMS messages error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Get SMS conversations (Admin only)
router.get('/device/:deviceId/conversations', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const device = await Device.findByPk(req.params.deviceId);
    if (!device) {
      return res.status(404).json({
        success: false,
        error: 'Device not found'
      });
    }

    const conversations = await SMS.findAll({
      where: { device_id: device.id, is_deleted: false },
      attributes: [
        'thread_id',
        'address',
        [sequelize.fn('COUNT', sequelize.col('id')), 'message_count'],
        [sequelize.fn('MAX', sequelize.col('date')), 'last_message_date']
      ],
      group: ['thread_id', 'address'],
      order: [[sequelize.fn('MAX', sequelize.col('date')), 'DESC']]
    });

    res.json({
      success: true,
      data: { conversations }
    });
  } catch (error) {
    logger.error('Get SMS conversations error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Get SMS statistics (Admin only)
router.get('/stats/device/:deviceId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const device = await Device.findByPk(req.params.deviceId);
    if (!device) {
      return res.status(404).json({
        success: false,
        error: 'Device not found'
      });
    }

    const totalSMS = await SMS.count({
      where: { device_id: device.id, is_deleted: false }
    });

    const sentSMS = await SMS.count({
      where: { device_id: device.id, type: 'sent', is_deleted: false }
    });

    const receivedSMS = await SMS.count({
      where: { device_id: device.id, type: 'inbox', is_deleted: false }
    });

    const unreadSMS = await SMS.count({
      where: { device_id: device.id, read: false, is_deleted: false }
    });

    const recentSMS = await SMS.findAll({
      where: { device_id: device.id, is_deleted: false },
      limit: 5,
      order: [['date', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        total_sms: totalSMS,
        sent_sms: sentSMS,
        received_sms: receivedSMS,
        unread_sms: unreadSMS,
        recent_sms: recentSMS
      }
    });
  } catch (error) {
    logger.error('Get SMS stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

module.exports = router;
