const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Op } = require('sequelize');
const { Device, CallRecording, CallLog } = require('../config/database');
const { authenticateToken, authenticateDevice, requireAdmin } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Configure multer for call recording uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/call-recordings');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const deviceId = req.deviceId || 'unknown';
    const ext = path.extname(file.originalname);
    cb(null, `call_${deviceId}_${timestamp}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /\.(mp3|wav|m4a|aac|ogg|flac)$/i;
    if (allowedTypes.test(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only audio files are allowed.'));
    }
  }
});

// Upload call recording (Device endpoint)
router.post('/upload', authenticateDevice, upload.single('recording'), async (req, res) => {
  try {
    const device = await Device.findOne({ where: { device_id: req.deviceId } });
    if (!device) {
      return res.status(404).json({
        success: false,
        error: 'Device not found'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No recording file provided'
      });
    }

    const {
      phone_number,
      contact_name,
      call_type,
      call_start_time,
      call_end_time,
      call_duration,
      recording_duration,
      recording_format,
      recording_quality,
      recording_source,
      call_direction,
      sim_slot,
      network_type,
      call_state_changes,
      metadata,
      transcription,
      transcription_confidence
    } = req.body;

    // Try to find associated call log
    let call_log_id = null;
    if (phone_number && call_start_time) {
      const callLog = await CallLog.findOne({
        where: {
          device_id: device.id,
          phone_number: phone_number,
          call_date: {
            [Op.between]: [
              new Date(new Date(call_start_time).getTime() - 60000), // 1 minute before
              new Date(new Date(call_start_time).getTime() + 60000)  // 1 minute after
            ]
          }
        }
      });
      if (callLog) {
        call_log_id = callLog.id;
      }
    }

    const callRecording = await CallRecording.create({
      device_id: device.id,
      call_log_id,
      phone_number,
      contact_name,
      call_type,
      call_start_time: call_start_time ? new Date(call_start_time) : null,
      call_end_time: call_end_time ? new Date(call_end_time) : null,
      call_duration: parseInt(call_duration) || null,
      recording_file_path: req.file.path,
      recording_file_name: req.file.originalname,
      recording_file_size: req.file.size,
      recording_duration: parseInt(recording_duration) || null,
      recording_format: recording_format || path.extname(req.file.originalname).substring(1),
      recording_quality: recording_quality || 'medium',
      recording_source,
      call_direction,
      sim_slot: sim_slot ? parseInt(sim_slot) : null,
      network_type,
      call_state_changes: call_state_changes ? JSON.parse(call_state_changes) : null,
      metadata: metadata ? JSON.parse(metadata) : null,
      transcription,
      transcription_confidence: transcription_confidence ? parseFloat(transcription_confidence) : null,
      processing_status: 'pending'
    });

    logger.info(`Call recording uploaded from device: ${req.deviceId}, phone: ${phone_number}, duration: ${call_duration}s`);

    // Emit to admin room
    if (req.io) {
      req.io.to('admin-room').emit('new-call-recording', {
        device_id: req.deviceId,
        phone_number,
        call_type,
        recording_id: callRecording.id
      });
    }

    res.json({
      success: true,
      message: 'Call recording uploaded successfully',
      data: {
        recording_id: callRecording.id,
        file_size: req.file.size
      }
    });
  } catch (error) {
    logger.error('Call recording upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Get call recordings for device (Admin only)
router.get('/device/:deviceId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50, phone_number, call_type, call_direction, from, to, is_important } = req.query;
    const offset = (page - 1) * limit;

    const device = await Device.findByPk(req.params.deviceId);
    if (!device) {
      return res.status(404).json({
        success: false,
        error: 'Device not found'
      });
    }

    const whereClause = { device_id: device.id, is_deleted: false };
    
    if (phone_number) {
      whereClause.phone_number = { [Op.like]: `%${phone_number}%` };
    }

    if (call_type) {
      whereClause.call_type = call_type;
    }

    if (call_direction) {
      whereClause.call_direction = call_direction;
    }

    if (is_important !== undefined) {
      whereClause.is_important = is_important === 'true';
    }

    if (from || to) {
      whereClause.call_start_time = {};
      if (from) whereClause.call_start_time[Op.gte] = new Date(from);
      if (to) whereClause.call_start_time[Op.lte] = new Date(to);
    }

    const { count, rows: recordings } = await CallRecording.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['call_start_time', 'DESC']],
      include: [
        {
          model: CallLog,
          as: 'callLog',
          required: false
        }
      ]
    });

    res.json({
      success: true,
      data: {
        recordings,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(count / limit),
          total_count: count,
          per_page: parseInt(limit)
        }
      }
    });
  } catch (error) {
    logger.error('Get call recordings error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Get all call recordings (Admin only)
router.get('/all', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50, phone_number, call_type, device_name } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = { is_deleted: false };
    const includeClause = [
      {
        model: Device,
        as: 'device',
        required: true
      }
    ];
    
    if (phone_number) {
      whereClause.phone_number = { [Op.like]: `%${phone_number}%` };
    }

    if (call_type) {
      whereClause.call_type = call_type;
    }

    if (device_name) {
      includeClause[0].where = {
        device_name: { [Op.like]: `%${device_name}%` }
      };
    }

    const { count, rows: recordings } = await CallRecording.findAndCountAll({
      where: whereClause,
      include: includeClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['call_start_time', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        recordings,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(count / limit),
          total_count: count,
          per_page: parseInt(limit)
        }
      }
    });
  } catch (error) {
    logger.error('Get all call recordings error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Download call recording (Admin only)
router.get('/download/:recordingId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const recording = await CallRecording.findByPk(req.params.recordingId);
    if (!recording || recording.is_deleted) {
      return res.status(404).json({
        success: false,
        error: 'Recording not found'
      });
    }

    if (!fs.existsSync(recording.recording_file_path)) {
      return res.status(404).json({
        success: false,
        error: 'Recording file not found on server'
      });
    }

    const filename = `${recording.phone_number}_${recording.call_start_time.toISOString().split('T')[0]}_${recording.id.substring(0, 8)}.${recording.recording_format}`;
    
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', `audio/${recording.recording_format}`);
    
    const fileStream = fs.createReadStream(recording.recording_file_path);
    fileStream.pipe(res);

    logger.info(`Call recording downloaded: ${recording.id} by admin`);
  } catch (error) {
    logger.error('Download call recording error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Update call recording (Admin only)
router.put('/:recordingId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const recording = await CallRecording.findByPk(req.params.recordingId);
    if (!recording || recording.is_deleted) {
      return res.status(404).json({
        success: false,
        error: 'Recording not found'
      });
    }

    const { notes, tags, is_important, transcription } = req.body;
    
    await recording.update({
      notes,
      tags: tags ? JSON.parse(tags) : recording.tags,
      is_important: is_important !== undefined ? is_important : recording.is_important,
      transcription: transcription || recording.transcription
    });

    res.json({
      success: true,
      message: 'Recording updated successfully',
      data: recording
    });
  } catch (error) {
    logger.error('Update call recording error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Delete call recording (Admin only)
router.delete('/:recordingId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const recording = await CallRecording.findByPk(req.params.recordingId);
    if (!recording || recording.is_deleted) {
      return res.status(404).json({
        success: false,
        error: 'Recording not found'
      });
    }

    // Soft delete
    await recording.update({ is_deleted: true });

    res.json({
      success: true,
      message: 'Recording deleted successfully'
    });
  } catch (error) {
    logger.error('Delete call recording error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Get call recording statistics (Admin only)
router.get('/stats/device/:deviceId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const device = await Device.findByPk(req.params.deviceId);
    if (!device) {
      return res.status(404).json({
        success: false,
        error: 'Device not found'
      });
    }

    const totalRecordings = await CallRecording.count({
      where: { device_id: device.id, is_deleted: false }
    });

    const incomingRecordings = await CallRecording.count({
      where: { device_id: device.id, call_direction: 'inbound', is_deleted: false }
    });

    const outgoingRecordings = await CallRecording.count({
      where: { device_id: device.id, call_direction: 'outbound', is_deleted: false }
    });

    const totalDuration = await CallRecording.sum('call_duration', {
      where: { device_id: device.id, is_deleted: false }
    });

    const totalFileSize = await CallRecording.sum('recording_file_size', {
      where: { device_id: device.id, is_deleted: false }
    });

    const importantRecordings = await CallRecording.count({
      where: { device_id: device.id, is_important: true, is_deleted: false }
    });

    const recentRecordings = await CallRecording.findAll({
      where: { device_id: device.id, is_deleted: false },
      limit: 10,
      order: [['call_start_time', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        total_recordings: totalRecordings,
        incoming_recordings: incomingRecordings,
        outgoing_recordings: outgoingRecordings,
        total_duration: totalDuration || 0,
        total_file_size: totalFileSize || 0,
        important_recordings: importantRecordings,
        recent_recordings: recentRecordings
      }
    });
  } catch (error) {
    logger.error('Get call recording stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

module.exports = router;
