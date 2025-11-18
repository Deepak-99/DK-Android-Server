const jwt = require('jsonwebtoken');
const { User, Device } = require('../models');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

/**
 * @typedef {Object} User
 * @property {string} id - The user's ID
 * @property {string} role - The user's role (e.g., 'admin', 'user')
 * @property {boolean} is_active - Whether the user is active
 */

/**
 * @typedef {import('express').Request} Request
 * @typedef {import('express').Response} Response
 * @typedef {import('express').NextFunction} NextFunction
 * 
 * @typedef {Object} AuthenticatedRequest
 * @property {User} [user] - Authenticated user object
 * @property {string} [deviceId] - Device ID for device-authenticated requests
 * @property {Object} [deviceAuth] - Decoded device authentication data
 * @extends Request
 */

/**
 * Middleware to authenticate user via JWT token
 * @param {AuthenticatedRequest} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 */
const authenticateToken = async (req, res, next) => {
  try {
    // Get token from Authorization header or query parameter
    let token;
    const authHeader = req.headers['authorization'];
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      logger.warn('No token provided', { path: req.path, method: req.method });
      return res.status(401).json({ 
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        logger.warn('Token expired', { path: req.path, method: req.method });
        return res.status(401).json({
          success: false,
          error: 'Session expired. Please log in again.',
          code: 'TOKEN_EXPIRED'
        });
      }
      logger.error('Token verification failed', { error: err.message });
      return res.status(401).json({
        success: false,
        error: 'Invalid token',
        code: 'TOKEN_INVALID'
      });
    }

    // Get user from database
    const user = await User.findByPk(decoded.userId);
    if (!user) {
      logger.warn('User not found', { userId: decoded.userId });
      return res.status(401).json({
        success: false,
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    if (!user.isActive) {
      logger.warn('User account is inactive', { userId: user.id });
      return res.status(403).json({
        success: false,
        error: 'Account is inactive',
        code: 'ACCOUNT_INACTIVE'
      });
    }

    // Attach user to request
    req.user = user.get({ plain: true });
    logger.debug('User authenticated', { userId: user.id, role: user.role });
    
    // Continue to the next middleware/route handler
    next();
  } catch (error) {
    logger.error('Token verification failed:', error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    return res.status(403).json({ 
      error: 'Invalid token',
      code: 'TOKEN_INVALID'
    });
  }
};

/**
 * Middleware to authenticate device via device token
 * @param {AuthenticatedRequest} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 */
const authenticateDevice = async (req, res, next) => {
  const requestId = req.requestId || 'unknown';
  logger.info(`[${requestId}] Authenticating device`);
  
  try {
    // Get token from Authorization header or query parameter
    let token;
    const authHeader = req.headers['authorization'];
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      logger.warn(`[${requestId}] No device token provided`, { 
        path: req.path, 
        method: req.method 
      });
      return res.status(401).json({ 
        success: false,
        error: 'Device token required',
        code: 'DEVICE_TOKEN_REQUIRED'
      });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      
      // Find device in database
      const device = await Device.findOne({ 
        where: { 
          deviceId: decoded.deviceId,
          status: { [Op.ne]: 'banned' }
        } 
      });

      if (!device) {
        logger.warn(`[${requestId}] Device not found or banned`, { 
          deviceId: decoded.deviceId 
        });
        return res.status(401).json({
          success: false,
          error: 'Device not registered or access denied',
          code: 'DEVICE_NOT_FOUND'
        });
      }

      // Update last seen timestamp
      await device.update({ 
        lastSeen: new Date(),
        ipAddress: req.ip
      });

      // Attach device to request
      req.device = device.get({ plain: true });
      req.deviceId = decoded.deviceId;
      
      logger.debug(`[${requestId}] Device authenticated`, { 
        deviceId: decoded.deviceId,
        deviceName: device.name 
      });
      
      return next();
      
    } catch (err) {
      logger.error(`[${requestId}] Device token verification failed:`, err);
      
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          error: 'Device token expired',
          code: 'DEVICE_TOKEN_EXPIRED'
        });
      }
      
      return res.status(401).json({
        success: false,
        error: 'Invalid device token',
        code: 'DEVICE_TOKEN_INVALID',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  } catch (error) {
    logger.error(`[${requestId}] Device authentication error:`, error);
    return res.status(500).json({
      success: false,
      error: 'Device authentication failed',
      code: 'AUTH_FAILED',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Middleware to require admin role
 * @param {AuthenticatedRequest} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 */
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ 
      error: 'Admin access required',
      code: 'ADMIN_REQUIRED'
    });
  }
  next();
};

/**
 * Middleware for optional authentication
 * @param {AuthenticatedRequest} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 */
const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findByPk(decoded.userId);
      if (user && user.is_active) {
        req.user = user;
      }
    } catch (error) {
      // Ignore token errors for optional auth
      logger.debug('Optional auth failed:', error.message);
    }
  }
  
  next();
};

module.exports = {
  authenticateToken,
  authenticateDevice,
  requireAdmin,
  optionalAuth
};
