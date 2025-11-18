const logger = require('../utils/logger');
const { Device } = require('../config/database');

class PrivatePushService {
  constructor(io) {
    this.io = io;
    this.connectedDevices = new Map(); // deviceId -> socketId
  }

  // Register device connection
  registerDevice(deviceId, socketId) {
    this.connectedDevices.set(deviceId, socketId);
    logger.info(`Device ${deviceId} registered with socket ${socketId}`);
  }

  // Unregister device connection
  unregisterDevice(deviceId) {
    this.connectedDevices.delete(deviceId);
    logger.info(`Device ${deviceId} unregistered`);
  }

  // Send command to specific device (replaces FCM)
  async sendCommandToDevice(deviceId, command) {
    try {
      const socketId = this.connectedDevices.get(deviceId);
      
      if (socketId) {
        // Device is online - send via Socket.IO immediately
        this.io.to(`device-${deviceId}`).emit('command', {
          type: command.type,
          data: command.data,
          timestamp: new Date().toISOString(),
          commandId: command.id
        });
        
        logger.info(`Command sent to device ${deviceId} via Socket.IO`);
        return { success: true, method: 'socket' };
      } else {
        // Device is offline - store command for polling
        await this.storeOfflineCommand(deviceId, command);
        logger.info(`Command stored for offline device ${deviceId}`);
        return { success: true, method: 'stored' };
      }
    } catch (error) {
      logger.error(`Failed to send command to device ${deviceId}:`, error);
      return { success: false, error: error.message };
    }
  }

  // Store command for offline devices
  async storeOfflineCommand(deviceId, command) {
    const { PendingCommand } = require('../models');
    
    await PendingCommand.create({
      deviceId,
      commandType: command.type,
      commandData: command.data,
      createdAt: new Date(),
      status: 'pending'
    });
  }

  // Get pending commands for device (for HTTP polling)
  async getPendingCommands(deviceId) {
    const { PendingCommand } = require('../models');
    
    const commands = await PendingCommand.findAll({
      where: {
        deviceId,
        status: 'pending'
      },
      order: [['createdAt', 'ASC']]
    });

    return commands.map(cmd => ({
      id: cmd.id,
      type: cmd.commandType,
      data: cmd.commandData,
      timestamp: cmd.createdAt
    }));
  }

  // Mark commands as delivered
  async markCommandsDelivered(commandIds) {
    const { PendingCommand } = require('../models');
    
    await PendingCommand.update(
      { status: 'delivered' },
      { where: { id: commandIds } }
    );
  }

  // Broadcast to all connected devices
  broadcastToAllDevices(command) {
    this.io.emit('broadcast-command', {
      type: command.type,
      data: command.data,
      timestamp: new Date().toISOString()
    });
    
    logger.info(`Broadcast command sent to all devices`);
  }

  // Get connection status for admin panel
  getDeviceConnectionStatus() {
    const status = {};
    this.connectedDevices.forEach((socketId, deviceId) => {
      status[deviceId] = {
        connected: true,
        socketId,
        lastSeen: new Date().toISOString()
      };
    });
    return status;
  }

  // Send notification to admin panel
  notifyAdmin(event, data) {
    this.io.to('admin-room').emit('admin-notification', {
      event,
      data,
      timestamp: new Date().toISOString()
    });
  }
}

module.exports = PrivatePushService;
