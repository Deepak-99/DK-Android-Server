const express = require('express');
const router = express.Router();
const { Command, Device, PendingCommand } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

// Get commands for a device
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { device_id, limit = 50, offset = 0, status } = req.query;
    
    if (!device_id) {
      return res.status(400).json({ error: 'Device ID is required' });
    }
    
    const where = { device_id };
    if (status) {
      where.status = status;
    }
    
    const { count, rows: commands } = await Command.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    res.json({
      total: count,
      limit: parseInt(limit),
      offset: parseInt(offset),
      data: commands
    });
  } catch (error) {
    logger.error('Error fetching commands:', error);
    res.status(500).json({ error: 'Failed to fetch commands' });
  }
});

// Create a new command
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { 
      device_id, 
      command_type, 
      command_data = {},
      priority = 'normal',
      ttl = 86400, // 24 hours default TTL
      requires_ack = true
    } = req.body;
    
    if (!device_id || !command_type) {
      return res.status(400).json({ error: 'Device ID and command type are required' });
    }
    
    // Check if device exists
    const device = await Device.findOne({ 
      where: { 
        [Op.or]: [
          { id: device_id },
          { deviceId: device_id }
        ]
      } 
    });
    
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }
    
    // Create command in database
    const command = await Command.create({
      device_id: device.id,
      command_type,
      command_data,
      status: 'pending',
      priority,
      ttl,
      requires_ack: !!requires_ack
    });
    
    // Get WebSocket service
    const webSocketService = req.app.get('webSocketService');
    
    // Send command via WebSocket if device is online
    if (device.isOnline) {
      const result = await webSocketService.sendCommand(device.deviceId || device.id, {
        command_type,
        command_data,
        priority,
        requires_ack
      });
      
      if (result.success) {
        // Update command with the ID from WebSocket service if available
        if (result.commandId) {
          command.id = result.commandId;
          await command.save();
        }
        return res.status(201).json(command);
      } else {
        // If WebSocket send fails, mark as failed
        command.status = 'failed';
        command.response = { error: result.error || 'Failed to send command' };
        await command.save();
        
        return res.status(500).json({ 
          error: 'Failed to send command to device',
          details: result.error 
        });
      }
    } else {
      // If device is offline, add to pending commands
      await PendingCommand.create({
        device_id: device.id,
        command_id: command.id,
        command_type,
        command_data,
        priority,
        expires_at: new Date(Date.now() + (ttl * 1000))
      });
      
      return res.status(202).json({
        ...command.toJSON(),
        message: 'Device is offline. Command will be delivered when device comes online.'
      });
    }
  } catch (error) {
    logger.error('Error creating command:', error);
    res.status(500).json({ error: 'Failed to create command' });
  }
});

// Update command status
router.patch('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, result, error } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }
    
    const command = await Command.findByPk(id);
    if (!command) {
      return res.status(404).json({ error: 'Command not found' });
    }
    
    // Update command status
    command.status = status;
    if (result) command.result = result;
    if (error) command.error = error;
    command.completed_at = ['completed', 'failed'].includes(status) ? new Date() : null;
    
    await command.save();
    
    // Remove from pending commands if completed or failed
    if (['completed', 'failed'].includes(status)) {
      await PendingCommand.destroy({
        where: { command_id: id }
      });
    }
    
    res.json(command);
  } catch (error) {
    logger.error('Error updating command status:', error);
    res.status(500).json({ error: 'Failed to update command status' });
  }
});

// Get pending commands for a device
router.get('/pending', async (req, res) => {
  try {
    const { device_id } = req.query;
    
    if (!device_id) {
      return res.status(400).json({ error: 'Device ID is required' });
    }
    
    const commands = await PendingCommand.findAll({
      where: { 
        device_id,
        expires_at: { [Op.gt]: new Date() }
      },
      order: [
        ['priority', 'DESC'],
        ['createdAt', 'ASC']
      ]
    });
    
    res.json(commands);
  } catch (error) {
    logger.error('Error fetching pending commands:', error);
    res.status(500).json({ error: 'Failed to fetch pending commands' });
  }
});

// Delete a command
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await Command.destroy({
      where: { id }
    });
    
    if (!result) {
      return res.status(404).json({ error: 'Command not found' });
    }
    
    // Also delete from pending commands if it exists there
    await PendingCommand.destroy({
      where: { command_id: id }
    });
    
    res.status(204).end();
  } catch (error) {
    logger.error('Error deleting command:', error);
    res.status(500).json({ error: 'Failed to delete command' });
  }
});

module.exports = router;
