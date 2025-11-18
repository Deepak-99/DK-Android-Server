const { Op } = require('sequelize');
const { Command, Device } = require('../models');
const logger = require('../utils/logger');

class WebSocketService {
  /**
   * Create a new WebSocketService instance
   * @param {Object} io - Socket.IO server instance
   */
  constructor(io) {
    console.log('\n=== 🔄 [WebSocketService] Constructor called ===');
    console.log('📡 Initializing WebSocket service...');
    
    try {
      // Validate IO instance
      if (!io) {
        const error = new Error('Socket.IO instance is required');
        console.error('❌ [WebSocketService]', error.message);
        throw error;
      }
      
      this.io = io;
      this.connectedDevices = new Map();
      this.connectionCount = 0;
      this.maxConnectionAttempts = 5;
      this.connectionTimeout = 30000; // 30 seconds
      
      console.log('✅ [WebSocketService] Instance created');
      console.log(`   - Namespace: ${io.nsps ? io.nsps.length : 1} namespaces`);
      
      // Set up event handlers
      this.setupEventHandlers();
      
      // Set up periodic status logging
      this.setupStatusLogging();
      
      console.log('✅ [WebSocketService] Initialization completed\n');
      
    } catch (error) {
      console.error('❌ [WebSocketService] Fatal error during initialization:', error);
      
      // Clean up resources
      this.shutdown()
        .catch(err => console.error('Error during shutdown:', err));
      
      throw error; // Re-throw to prevent server from starting with a broken WebSocket service
    }
  }

  /**
   * Set up periodic status logging for WebSocket service
   */
  setupStatusLogging() {
    // Log status every 5 minutes
    this.statusInterval = setInterval(() => {
      try {
        const now = new Date();
        const memoryUsage = process.memoryUsage();
        
        console.log('\n=== 📡 WebSocket Service Status ===');
        console.log(`🕒 Time: ${now.toISOString()}`);
        console.log(`👥 Active connections: ${this.connectedDevices.size}`);
        console.log(`🔄 Total connections: ${this.connectionCount}`);
        console.log(`💾 Memory usage: ${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`);
        
        // Log connected devices (first 5 to avoid log spam)
        if (this.connectedDevices.size > 0) {
          console.log(`\n📱 Connected Devices (${this.connectedDevices.size}):`);
          let count = 0;
          for (const [deviceId, socket] of this.connectedDevices.entries()) {
            if (count++ >= 5) {
              console.log(`   ...and ${this.connectedDevices.size - 5} more`);
              break;
            }
            const uptime = Math.round((Date.now() - (socket.handshake.connectedAt || Date.now())) / 1000);
            console.log(`   - ${deviceId}: ${socket.id} (${uptime}s)`);
          }
        }
        console.log('='.repeat(40) + '\n');
      } catch (error) {
        console.error('Error in status logging:', error);
      }
    }, 5 * 60 * 1000); // 5 minutes
    
    // Clear interval on process exit
    process.on('exit', () => {
      if (this.statusInterval) {
        clearInterval(this.statusInterval);
      }
    });
  }
  
  /**
   * Set up WebSocket event handlers
   */
  setupEventHandlers() {
    console.log('\n=== 🔌 Setting up WebSocket event handlers ===');
    
    if (!this.io) {
      const error = new Error('Socket.IO instance not available in setupEventHandlers');
      console.error('❌ [WebSocketService]', error.message);
      throw error;
    }
    
    try {
      // Handle new connections
      this.io.on('connection', (socket) => {
        this.connectionCount++;
        const clientId = socket.id;
        const deviceId = socket.handshake.query.deviceId || `client-${Date.now()}`;
        
        // Store connection time
        socket.handshake.connectedAt = Date.now();
        
        console.log(`\n=== 🔌 New WebSocket connection ===`);
        console.log(`   - Client ID: ${clientId}`);
        console.log(`   - Device ID: ${deviceId}`);
        console.log(`   - Total connections: ${this.connectionCount}`);
        
        // Store the socket reference
        this.connectedDevices.set(deviceId, socket);
        
        // Send welcome message
        socket.emit('welcome', {
          status: 'connected',
          serverTime: new Date().toISOString(),
          clientId: clientId,
          message: 'Successfully connected to WebSocket server'
        });
        
        // Log device connection
        logger.info('Device connected', {
          deviceId,
          clientId,
          ip: socket.handshake.address,
          userAgent: socket.handshake.headers['user-agent'],
          timestamp: new Date().toISOString()
        });
        
        // Setup custom event handlers
        this.setupCustomEventHandlers(socket);
        
        // Handle disconnection
        socket.on('disconnect', (reason) => {
          this.handleDisconnect(deviceId, clientId, reason);
        });
        
        // Handle errors
        socket.on('error', (error) => {
          this.handleSocketError(error, deviceId, clientId);
        });
      });
      
      // Handle WebSocket server errors
      this.io.on('error', (error) => {
        console.error('❌ [WebSocketService] Server error:', error);
        logger.error('WebSocket server error', {
          error: error.message,
          stack: error.stack,
          timestamp: new Date().toISOString()
        });
      });
      
      console.log('✅ [WebSocketService] Event handlers set up successfully');
      
    } catch (error) {
      console.error('❌ [WebSocketService] Failed to set up event handlers:', error);
      logger.error('Failed to set up WebSocket event handlers', {
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
      throw error;
    }    
  }
  
  /**
   * Set up custom event handlers for WebSocket connections
   * @param {Socket} socket - The socket instance
   */
  setupCustomEventHandlers(socket) {
    // Add ping/pong for connection health
    socket.on('ping', (cb) => {
      if (typeof cb === 'function') {
        cb('pong');
      }
    });
    
    // Handle device registration
    socket.on('register', (deviceInfo, callback) => {
      try {
        const { deviceId } = deviceInfo || {};
        if (!deviceId) {
          throw new Error('Device ID is required');
        }
        
        console.log(`📱 Registering device: ${deviceId}`);
        this.connectedDevices.set(deviceId, socket);
        
        if (typeof callback === 'function') {
          callback({ status: 'success', deviceId });
        }
      } catch (error) {
        console.error('❌ Error registering device:', error);
        if (typeof callback === 'function') {
          callback({ status: 'error', message: error.message });
        }
      }
    });
    
    // Handle command responses from devices
    socket.on('command-response', async (data) => {
      try {
        console.log('🔽 Command response received:', data);
        
        if (data.commandId) {
          await Command.update(
            { 
              status: data.success ? 'completed' : 'failed', 
              response: data.response || null,
              completedAt: new Date()
            },
            { 
              where: { id: data.commandId },
              silent: true
            }
          );
          
          console.log(`✅ Updated command ${data.commandId} status to ${data.success ? 'completed' : 'failed'}`);
          
          // Forward response to admin dashboard
          this.io.to('admin').emit('command-response', {
            ...data,
            timestamp: new Date().toISOString()
          });
        }
      } catch (error) {
        console.error('❌ Error processing command response:', error);
        logger.error('Command response error', {
          commandId: data?.commandId,
          error: error.message,
          stack: error.stack,
          timestamp: new Date().toISOString()
        });
      }
    });
    
    // Handle admin dashboard connection
    socket.on('admin-connect', () => {
      console.log('👨‍💼 Admin dashboard connected:', socket.id);
      socket.join('admin');
      
      // Send current status to the admin
      this.io.to(socket.id).emit('admin-status', {
        status: 'connected',
        connectedDevices: this.getConnectedDevices().length,
        timestamp: new Date().toISOString()
      });
    });
  }
  
  /**
   * Handle device disconnection
   * @param {string} deviceId - The ID of the device
   * @param {string} clientId - The socket ID of the client
   * @param {string} reason - Reason for disconnection
   */
  async handleDisconnect(deviceId, clientId, reason) {
    console.log(`\n=== ❌ WebSocket disconnected ===`);
    console.log(`   - Client ID: ${clientId}`);
    console.log(`   - Device ID: ${deviceId}`);
    console.log(`   - Reason: ${reason}`);
    
    // Remove from connected devices if this is the same socket
    const existingSocket = this.connectedDevices.get(deviceId);
    if (existingSocket && existingSocket.id === clientId) {
      this.connectedDevices.delete(deviceId);
      
      // Update device status in the database
      try {
        await this.updateDeviceStatus(deviceId, false);
      } catch (error) {
        console.error(`❌ Error updating device status for ${deviceId}:`, error);
      }
    }
    
    // Log disconnection
    logger.info('Device disconnected', {
      deviceId,
      clientId,
      reason,
      timestamp: new Date().toISOString()
    });
  }
  
  /**
   * Handle socket errors
   * @param {Error} error - The error that occurred
   * @param {string} deviceId - The ID of the device
   * @param {string} clientId - The socket ID of the client
   */
  handleSocketError(error, deviceId, clientId) {
    console.error(`❌ [WebSocketService] Socket error (${clientId}):`, error);
    logger.error('WebSocket error', {
      deviceId,
      clientId,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  }
  
  /**
   * Update device status in the database
   * @param {string} deviceId - The ID of the device
   * @param {boolean} isOnline - Whether the device is online
   */
  async updateDeviceStatus(deviceId, isOnline) {
    try {
      await Device.update(
        { 
          isOnline, 
          lastSeen: new Date() 
        },
        { 
          where: { deviceId },
          silent: true // Don't trigger model hooks
        }
      );
      console.log(`✅ Updated device ${deviceId} status: ${isOnline ? 'online' : 'offline'}`);
    } catch (error) {
      console.error('❌ Error updating device status:', error);
      logger.error('Failed to update device status', {
        deviceId,
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
    }
  }
  
  /**
   * Clean up resources when the service is stopped
   * @returns {Promise<void>}
   */
  async shutdown() {
    console.log('\n=== 🛑 Shutting down WebSocket service ===');
    
    try {
      // Clear status interval
      if (this.statusInterval) {
        clearInterval(this.statusInterval);
        this.statusInterval = null;
        console.log('✅ Stopped status logging');
      }
      
      // Close all connections
      if (this.io) {
        console.log('🔄 Closing WebSocket connections...');
        
        // Notify all connected clients
        this.io.emit('server-shutdown', {
          message: 'Server is shutting down',
          timestamp: new Date().toISOString()
        });
        
        // Disconnect all sockets
        const sockets = await this.io.fetchSockets();
        for (const socket of sockets) {
          socket.disconnect(true);
        }
        
        // Close the server
        await new Promise((resolve) => {
          this.io.close(() => {
            console.log('✅ WebSocket server closed');
            this.io = null;
            resolve();
          });
        });
      }
      
      // Clear the connected devices map
      this.connectedDevices.clear();
      console.log('✅ Cleared connected devices');
      
      console.log('✅ WebSocket service shutdown complete\n');
      
    } catch (error) {
      console.error('❌ Error during WebSocket service shutdown:', error);
      throw error;
    }
  }
  
  /**
   * Send a command to a specific device
   * @param {string} deviceId - The ID of the target device
   * @param {Object} command - The command to send
   * @param {string} command.type - The type of command
   * @param {Object} [command.data] - Optional command data
   * @param {number} [command.timeout=30000] - Command timeout in milliseconds
   * @returns {Promise<Object>} Command result
   */
  async sendCommand(deviceId, command) {
    const socket = this.connectedDevices.get(deviceId);
    
    if (!socket) {
      const error = new Error(`Device ${deviceId} is not connected`);
      console.error(`❌ ${error.message}`);
      return { 
        success: false, 
        error: error.message,
        deviceId,
        timestamp: new Date().toISOString()
      };
    }
    
    const commandId = `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
    const timeout = command.timeout || 30000; // Default 30 seconds timeout
    
    try {
      // Create command in database
      const dbCommand = await Command.create({
        id: commandId,
        deviceId,
        commandType: command.type,
        commandData: command.data || {},
        status: 'pending',
        sentAt: new Date(),
        timeoutAt: new Date(Date.now() + timeout)
      });
      
      // Send command to device
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          socket.removeListener('command-response', onResponse);
          reject(new Error(`Command ${commandId} timed out after ${timeout}ms`));
        }, timeout);
        
        const onResponse = (response) => {
          if (response.commandId === commandId) {
            clearTimeout(timer);
            socket.removeListener('command-response', onResponse);
            resolve({
              success: true,
              commandId,
              response,
              timestamp: new Date().toISOString()
            });
          }
        };
        
        // Listen for response
        socket.on('command-response', onResponse);
        
        // Send the command
        socket.emit('command', {
          commandId,
          type: command.type,
          data: command.data || {},
          timestamp: new Date().toISOString()
        });
        
        console.log(`📤 Sent command to device ${deviceId}:`, {
          commandId,
          type: command.type,
          timeout: `${timeout}ms`
        });
      });
      
    } catch (error) {
      console.error(`❌ Error sending command to device ${deviceId}:`, error);
      
      // Update command status in database
      await Command.update(
        { 
          status: 'failed',
          error: error.message,
          completedAt: new Date()
        },
        { where: { id: commandId } }
      );
      
      return { 
        success: false, 
        error: error.message,
        commandId,
        timestamp: new Date().toISOString()
      };
    }
  }
}

module.exports = WebSocketService;
