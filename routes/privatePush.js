const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const logger = require('../utils/logger');

// Get pending commands for device (replaces FCM polling)
router.get('/commands/:deviceId', authenticateToken, async (req, res) => {
  try {
    const { deviceId } = req.params;
    const privatePushService = req.app.get('privatePushService');
    
    const commands = await privatePushService.getPendingCommands(deviceId);
    
    res.json({
      success: true,
      commands,
      count: commands.length
    });
  } catch (error) {
    logger.error('Error getting pending commands:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get pending commands'
    });
  }
});

// Mark commands as delivered
router.post('/commands/delivered', authenticateToken, async (req, res) => {
  try {
    const { commandIds } = req.body;
    const privatePushService = req.app.get('privatePushService');
    
    await privatePushService.markCommandsDelivered(commandIds);
    
    res.json({
      success: true,
      message: 'Commands marked as delivered'
    });
  } catch (error) {
    logger.error('Error marking commands as delivered:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark commands as delivered'
    });
  }
});

// Register device for real-time communication
router.post('/register/:deviceId', authenticateToken, async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { socketId } = req.body;
    const privatePushService = req.app.get('privatePushService');
    
    privatePushService.registerDevice(deviceId, socketId);
    
    res.json({
      success: true,
      message: 'Device registered for real-time communication'
    });
  } catch (error) {
    logger.error('Error registering device:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register device'
    });
  }
});

// Send command to device (admin endpoint)
router.post('/send-command', authenticateToken, async (req, res) => {
  try {
    const { deviceId, command } = req.body;
    const privatePushService = req.app.get('privatePushService');
    
    const result = await privatePushService.sendCommandToDevice(deviceId, command);
    
    res.json({
      success: result.success,
      method: result.method,
      message: result.success ? 'Command sent successfully' : result.error
    });
  } catch (error) {
    logger.error('Error sending command:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send command'
    });
  }
});

// Get device connection status (admin endpoint)
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const privatePushService = req.app.get('privatePushService');
    const status = privatePushService.getDeviceConnectionStatus();
    
    res.json({
      success: true,
      deviceStatus: status
    });
  } catch (error) {
    logger.error('Error getting device status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get device status'
    });
  }
});

module.exports = router;
