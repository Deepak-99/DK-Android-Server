// controllers/api/v1/deviceController.js
const { Device, DeviceStatus, User } = require('../../../models');
const { Op } = require('sequelize');
const logger = require('../../../utils/logger');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

/**
 * Register a new device
 */
exports.registerDevice = async (req, res) => {
    try {
        const {
            deviceName,
            model,
            manufacturer,
            osVersion,
            sdkVersion,
            appVersion,
            fcmToken,
            imei,
            phoneNumber,
            simSerial,
            simOperator,
            networkOperator,
            macAddress,
            ipAddress,
            deviceType = 'android' // or 'ios'
        } = req.body;

        // Generate device token for API authentication
        const deviceToken = crypto.randomBytes(32).toString('hex');
        const deviceId = uuidv4();

        // Create device
        const device = await Device.create({
            id: deviceId,
            deviceName,
            model,
            manufacturer,
            osVersion,
            sdkVersion,
            appVersion,
            fcmToken,
            deviceToken,
            imei,
            phoneNumber,
            simSerial,
            simOperator,
            networkOperator,
            macAddress,
            ipAddress,
            deviceType,
            lastSeen: new Date(),
            isActive: true,
            isOnline: true
        });

        // Create initial status
        await DeviceStatus.create({
            deviceId,
            batteryLevel: 0,
            isCharging: false,
            isLowPowerMode: false,
            networkType: 'unknown',
            storage: {
                total: 0,
                available: 0,
                used: 0
            },
            memory: {
                total: 0,
                available: 0,
                used: 0
            },
            cpuUsage: 0,
            lastUpdated: new Date()
        });

        logger.info(`New device registered: ${deviceId} (${deviceName})`);

        return res.status(201).json({
            success: true,
            data: {
                deviceId,
                deviceToken
            }
        });

    } catch (error) {
        logger.error('Error registering device:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to register device'
        });
    }
};

/**
 * Get all devices (admin only)
 */
exports.getAllDevices = async (req, res) => {
    try {
        const { page = 1, limit = 10, status } = req.query;
        const offset = (page - 1) * limit;
        
        const whereClause = {};
        if (status) {
            whereClause.status = status;
        }

        const { count, rows } = await Device.findAndCountAll({
            where: whereClause,
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['lastSeen', 'DESC']]
        });

        return res.json({
            success: true,
            data: rows,
            pagination: {
                total: count,
                page: parseInt(page),
                totalPages: Math.ceil(count / limit)
            }
        });
    } catch (error) {
        logger.error('Error fetching devices:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch devices'
        });
    }
};

/**
 * Get device by ID
 */
exports.getDevice = async (req, res) => {
    try {
        const { deviceId } = req.params;
        const device = await Device.findByPk(deviceId);

        if (!device) {
            return res.status(404).json({
                success: false,
                error: 'Device not found'
            });
        }

        // Check if user has permission to access this device
        if (req.user.role !== 'admin' && req.user.deviceId !== deviceId) {
            return res.status(403).json({
                success: false,
                error: 'Not authorized to access this device'
            });
        }

        return res.json({
            success: true,
            data: device
        });
    } catch (error) {
        logger.error('Error fetching device:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch device'
        });
    }
};

/**
 * Update device information
 */
exports.updateDevice = async (req, res) => {
    try {
        const { deviceId } = req.params;
        const updates = req.body;

        const device = await Device.findByPk(deviceId);
        if (!device) {
            return res.status(404).json({
                success: false,
                error: 'Device not found'
            });
        }

        // Check permissions
        if (req.user.role !== 'admin' && req.user.deviceId !== deviceId) {
            return res.status(403).json({
                success: false,
                error: 'Not authorized to update this device'
            });
        }

        // Update device
        await device.update(updates);

        return res.json({
            success: true,
            data: device
        });
    } catch (error) {
        logger.error('Error updating device:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to update device'
        });
    }
};

/**
 * Delete a device (admin only)
 */
exports.deleteDevice = async (req, res) => {
    try {
        const { deviceId } = req.params;

        const device = await Device.findByPk(deviceId);
        if (!device) {
            return res.status(404).json({
                success: false,
                error: 'Device not found'
            });
        }

        // Soft delete the device
        await device.destroy();

        return res.json({
            success: true,
            message: 'Device deleted successfully'
        });
    } catch (error) {
        logger.error('Error deleting device:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to delete device'
        });
    }
};

/**
 * Get device status
 */
exports.getDeviceStatus = async (req, res) => {
    try {
        const { deviceId } = req.params;

        const device = await Device.findByPk(deviceId, {
            attributes: ['id', 'status', 'lastSeen', 'batteryLevel', 'storage', 'network']
        });

        if (!device) {
            return res.status(404).json({
                success: false,
                error: 'Device not found'
            });
        }

        // Check permissions
        if (req.user.role !== 'admin' && req.user.deviceId !== deviceId) {
            return res.status(403).json({
                success: false,
                error: 'Not authorized to access this device status'
            });
        }

        return res.json({
            success: true,
            data: {
                status: device.status,
                lastSeen: device.lastSeen,
                batteryLevel: device.batteryLevel,
                storage: device.storage,
                network: device.network
            }
        });
    } catch (error) {
        logger.error('Error fetching device status:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch device status'
        });
    }
};

/**
 * Handle device heartbeat
 */
exports.handleHeartbeat = async (req, res) => {
    try {
        const { deviceId } = req.params;
        const { batteryLevel, storage, network } = req.body;

        const device = await Device.findByPk(deviceId);
        if (!device) {
            return res.status(404).json({
                success: false,
                error: 'Device not found'
            });
        }

        // Update device status
        await device.update({
            lastSeen: new Date(),
            batteryLevel,
            storage,
            network,
            status: 'active'
        });

        // Check for pending commands
        const pendingCommands = await Command.findAll({
            where: {
                deviceId,
                status: 'pending',
                scheduledAt: { [Op.lte]: new Date() }
            },
            order: [['createdAt', 'ASC']],
            limit: 1
        });

        return res.json({
            success: true,
            commands: pendingCommands
        });
    } catch (error) {
        logger.error('Error processing heartbeat:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to process heartbeat'
        });
    }
};

/**
 * Get device statistics
 */
exports.getDeviceStatistics = async (req, res) => {
    try {
        const { deviceId } = req.params;

        // Check permissions
        if (req.user.role !== 'admin' && req.user.deviceId !== deviceId) {
            return res.status(403).json({
                success: false,
                error: 'Not authorized to access device statistics'
            });
        }

        // Get basic statistics (you can expand this with more metrics)
        const stats = {
            commands: {
                total: await Command.count({ where: { deviceId } }),
                pending: await Command.count({ where: { deviceId, status: 'pending' } }),
                completed: await Command.count({ where: { deviceId, status: 'completed' } }),
                failed: await Command.count({ where: { deviceId, status: 'failed' } })
            },
            lastSeen: (await Device.findByPk(deviceId, { attributes: ['lastSeen'] }))?.lastSeen
        };

        return res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        logger.error('Error fetching device statistics:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch device statistics'
        });
    }
};
