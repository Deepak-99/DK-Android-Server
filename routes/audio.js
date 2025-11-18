const express = require('express');
const { Op } = require('sequelize');
const { Device, DeviceAudio } = require('../config/database');
const { authenticateToken, authenticateDevice, requireAdmin } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Submit device audio data (Device endpoint)
router.post('/status', authenticateDevice, async (req, res) => {
  try {
    const device = await Device.findOne({ where: { device_id: req.deviceId } });
    if (!device) {
      return res.status(404).json({
        success: false,
        error: 'Device not found'
      });
    }

    const {
      ringer_mode,
      music_volume,
      ring_volume,
      call_volume,
      alarm_volume,
      notification_volume,
      system_volume,
      is_speaker_on,
      is_microphone_muted,
      audio_mode,
      bluetooth_audio_connected,
      wired_headset_connected,
      audio_focus_state,
      recording_file_path,
      recording_duration,
      recording_format,
      recording_quality
    } = req.body;

    const audioData = await DeviceAudio.create({
      device_id: device.id,
      ringer_mode,
      music_volume,
      ring_volume,
      call_volume,
      alarm_volume,
      notification_volume,
      system_volume,
      is_speaker_on,
      is_microphone_muted,
      audio_mode,
      bluetooth_audio_connected,
      wired_headset_connected,
      audio_focus_state,
      recording_file_path,
      recording_duration,
      recording_format,
      recording_quality
    });

    logger.info(`Device audio status received from device: ${req.deviceId}`);

    // Emit to admin room
    if (req.io) {
      req.io.to('admin-room').emit('device-audio-updated', {
        device_id: req.deviceId,
        ringer_mode,
        music_volume
      });
    }

    res.json({
      success: true,
      message: 'Audio status processed successfully',
      data: { id: audioData.id }
    });
  } catch (error) {
    logger.error('Submit device audio error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Set device audio (Admin command)
router.post('/set', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      device_id,
      ringer_mode,
      music_volume,
      ring_volume,
      call_volume,
      alarm_volume,
      notification_volume,
      system_volume,
      is_speaker_on,
      is_microphone_muted
    } = req.body;

    const device = await Device.findByPk(device_id);
    if (!device) {
      return res.status(404).json({
        success: false,
        error: 'Device not found'
      });
    }

    const Command = require('../config/database').Command;
    const command = await Command.create({
      device_id: device.id,
      command_type: 'set_device_audio',
      command_data: {
        ringer_mode,
        music_volume,
        ring_volume,
        call_volume,
        alarm_volume,
        notification_volume,
        system_volume,
        is_speaker_on,
        is_microphone_muted
      },
      priority: 'normal',
      created_by: req.user.id,
      expires_at: new Date(Date.now() + 60 * 60 * 1000) // 1 hour
    });

    // Emit to device room
    if (req.io) {
      req.io.to(`device-${device.device_id}`).emit('new-command', {
        command: command.toJSON()
      });
    }

    res.json({
      success: true,
      message: 'Set audio command sent',
      data: { command_id: command.id }
    });
  } catch (error) {
    logger.error('Set device audio command error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Record audio command (Admin command)
router.post('/record', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { device_id, duration, quality, format } = req.body;

    const device = await Device.findByPk(device_id);
    if (!device) {
      return res.status(404).json({
        success: false,
        error: 'Device not found'
      });
    }

    const Command = require('../config/database').Command;
    const command = await Command.create({
      device_id: device.id,
      command_type: 'record_audio',
      command_data: {
        duration: duration || 30,
        quality: quality || 'high',
        format: format || 'mp3'
      },
      priority: 'normal',
      created_by: req.user.id,
      expires_at: new Date(Date.now() + 60 * 60 * 1000) // 1 hour
    });

    // Emit to device room
    if (req.io) {
      req.io.to(`device-${device.device_id}`).emit('new-command', {
        command: command.toJSON()
      });
    }

    res.json({
      success: true,
      message: 'Record audio command sent',
      data: { command_id: command.id }
    });
  } catch (error) {
    logger.error('Record audio command error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Get device audio history (Admin only)
router.get('/history/device/:deviceId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50, from, to } = req.query;
    const offset = (page - 1) * limit;

    const device = await Device.findByPk(req.params.deviceId);
    if (!device) {
      return res.status(404).json({
        success: false,
        error: 'Device not found'
      });
    }

    const whereClause = { device_id: device.id };
    
    if (from || to) {
      whereClause.timestamp = {};
      if (from) whereClause.timestamp[Op.gte] = new Date(from);
      if (to) whereClause.timestamp[Op.lte] = new Date(to);
    }

    const { count, rows: audioHistory } = await DeviceAudio.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['timestamp', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        audio_history: audioHistory,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(count / limit),
          total_count: count,
          per_page: parseInt(limit)
        }
      }
    });
  } catch (error) {
    logger.error('Get audio history error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Get current audio status (Admin only)
router.get('/current/device/:deviceId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const device = await Device.findByPk(req.params.deviceId);
    if (!device) {
      return res.status(404).json({
        success: false,
        error: 'Device not found'
      });
    }

    const currentAudio = await DeviceAudio.findOne({
      where: { device_id: device.id },
      order: [['timestamp', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        current_audio: currentAudio
      }
    });
  } catch (error) {
    logger.error('Get current audio status error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

module.exports = router;
