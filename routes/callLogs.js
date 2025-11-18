const express = require('express');
const router = express.Router();
const { CallLog, CallRecording } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const logger = require('../utils/logger');

// Get all call logs for a device
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { device_id, limit = 100, offset = 0 } = req.query;
    
    if (!device_id) {
      return res.status(400).json({ error: 'Device ID is required' });
    }
    
    const where = { device_id };
    
    const { count, rows: callLogs } = await CallLog.findAndCountAll({
      where,
      order: [['timestamp', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: [
        {
          model: CallRecording,
          as: 'recording',
          required: false
        }
      ]
    });
    
    res.json({
      total: count,
      limit: parseInt(limit),
      offset: parseInt(offset),
      data: callLogs
    });
  } catch (error) {
    logger.error('Error fetching call logs:', error);
    res.status(500).json({ error: 'Failed to fetch call logs' });
  }
});

// Add a new call log
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { 
      device_id, 
      phone_number, 
      contact_name, 
      call_type, 
      duration, 
      timestamp, 
      is_new, 
      raw_data 
    } = req.body;
    
    if (!device_id || !phone_number || !call_type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const callLog = await CallLog.create({
      device_id,
      phone_number,
      contact_name: contact_name || null,
      call_type,
      duration: duration || 0,
      timestamp: timestamp || new Date(),
      is_new: is_new !== undefined ? is_new : true,
      raw_data: raw_data || {}
    });
    
    res.status(201).json(callLog);
  } catch (error) {
    logger.error('Error saving call log:', error);
    res.status(500).json({ error: 'Failed to save call log' });
  }
});

// Delete a call log
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { device_id } = req.query;
    
    if (!device_id) {
      return res.status(400).json({ error: 'Device ID is required' });
    }
    
    const result = await CallLog.destroy({
      where: { 
        id,
        device_id 
      }
    });
    
    if (!result) {
      return res.status(404).json({ error: 'Call log not found' });
    }
    
    res.status(204).end();
  } catch (error) {
    logger.error('Error deleting call log:', error);
    res.status(500).json({ error: 'Failed to delete call log' });
  }
});

// Sync call logs
router.post('/sync', authenticateToken, async (req, res) => {
  try {
    const { device_id, logs } = req.body;
    
    if (!device_id || !Array.isArray(logs)) {
      return res.status(400).json({ error: 'Invalid request data' });
    }
    
    // Process logs in bulk
    const results = await Promise.all(
      logs.map(log => 
        CallLog.upsert({
          ...log,
          device_id,
          is_new: false
        }, {
          conflictFields: ['device_id', 'phone_number', 'timestamp']
        })
      )
    );
    
    res.json({
      success: true,
      processed: results.length
    });
  } catch (error) {
    logger.error('Error syncing call logs:', error);
    res.status(500).json({ error: 'Failed to sync call logs' });
  }
});

module.exports = router;
