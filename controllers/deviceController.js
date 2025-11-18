const { Device } = require('../models');
const logger = require('../utils/logger');

/**
 * Register or update a device
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} Response with device data and auth token
 */
exports.registerDevice = async (req, res) => {
    const requestId = req.requestId || 'unknown';
    logger.info(`[${requestId}] Device registration request`);
    
    try {
        const {
            deviceId,        // Required: Unique device identifier
            name,           // Device name
            model,          // Device model
            manufacturer,   // Device manufacturer
            androidVersion, // Android version
            apiLevel,       // API level
            imei,           // Device IMEI
            phoneNumber,    // Phone number
            fcmToken,       // Firebase Cloud Messaging token
            appVersion      // App version
        } = req.body;

        // Input validation
        if (!deviceId) {
            logger.warn(`[${requestId}] Missing required field: deviceId`);
            return res.status(400).json({
                success: false,
                error: 'deviceId is required'
            });
        }

        // Check if device exists
        let device = await Device.findOne({ 
            where: { deviceId } 
        });

        const deviceData = {
            deviceId,
            name: name || null,
            model: model || null,
            manufacturer: manufacturer || null,
            androidVersion: androidVersion || null,
            apiLevel: apiLevel || null,
            imei: imei || null,
            phoneNumber: phoneNumber || null,
            fcmToken: fcmToken || null,
            appVersion: appVersion || null,
            status: 'online',
            lastSeen: new Date(),
            ipAddress: req.ip
        };

        if (device) {
            // Update existing device
            logger.info(`[${requestId}] Updating existing device: ${deviceId}`);
            device = await device.update(deviceData);
        } else {
            // Create new device
            logger.info(`[${requestId}] Registering new device: ${deviceId}`);
            device = await Device.create(deviceData);
        }

        // Generate JWT token
        const token = jwt.sign(
            { 
                deviceId: device.deviceId, 
                deviceUuid: device.id 
            },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '30d' }
        );

        logger.info(`[${requestId}] Device ${deviceId} registration successful`);

        return res.json({
            success: true,
            token,
            device: {
                id: device.id,
                deviceId: device.deviceId,
                name: device.name,
                nickname: device.nickname,
                status: device.status,
                lastSeen: device.lastSeen
            }
        });
    } catch (error) {
        logger.error(`[${requestId}] Device registration error:`, error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error during device registration',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Update device nickname
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} Response with updated device data
 */
exports.updateNickname = async (req, res) => {
    const { deviceId } = req.params;
    const { nickname } = req.body;
    const requestId = req.requestId || 'unknown';

    try {
        if (!nickname) {
            return res.status(400).json({
                success: false,
                error: 'Nickname is required'
            });
        }

        const device = await Device.findOne({ where: { deviceId } });
        if (!device) {
            return res.status(404).json({
                success: false,
                error: 'Device not found'
            });
        }

        await device.update({ nickname });
        logger.info(`[${requestId}] Updated nickname for device ${deviceId}`);

        return res.json({
            success: true,
            device: {
                id: device.id,
                deviceId: device.deviceId,
                nickname: device.nickname
            }
        });
    } catch (error) {
        logger.error(`[${requestId}] Error updating device nickname:`, error);
        return res.status(500).json({
            success: false,
            error: 'Failed to update device nickname'
        });
    }
};

/**
 * Get device details
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} Response with device data
 */
exports.getDevice = async (req, res) => {
    const { deviceId } = req.params;
    const requestId = req.requestId || 'unknown';

    try {
        const device = await Device.findOne({ 
            where: { deviceId },
            attributes: { exclude: ['createdAt', 'updatedAt'] }
        });

        if (!device) {
            return res.status(404).json({
                success: false,
                error: 'Device not found'
            });
        }

        logger.debug(`[${requestId}] Retrieved device: ${deviceId}`);
        return res.json({
            success: true,
            device
        });
    } catch (error) {
        logger.error(`[${requestId}] Error fetching device ${deviceId}:`, error);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch device details'
        });
    }
};

/**
 * Handle device heartbeat
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} Response with updated device status
 */
exports.handleHeartbeat = async (req, res) => {
    const { deviceId } = req.device;
    const requestId = req.requestId || 'unknown';
    
    try {
        const device = await Device.findOne({ where: { deviceId } });
        if (!device) {
            return res.status(404).json({
                success: false,
                error: 'Device not found'
            });
        }

        // Update last seen timestamp and set status to online
        await device.update({
            lastSeen: new Date(),
            status: 'online',
            ipAddress: req.ip
        });

        logger.debug(`[${requestId}] Device heartbeat received: ${deviceId}`);
        
        return res.json({
            success: true,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error(`[${requestId}] Error processing heartbeat for device ${deviceId}:`, error);
        return res.status(500).json({
            success: false,
            error: 'Failed to process heartbeat'
        });
    }
};
