const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const {
  User,
  Device,
  UserPermission,
  Role,
  Permission,
  UserRole,
  RolePermission
} = require('../config/database');
const logger = require('../utils/logger');

const buildPermissionKey = (resource, action) => `${resource}.${action}`;

/**
 * Build effective permission set for a user:
 *  - All Permission.key from roles via RolePermission
 *  - PLUS any UserPermission overrides (resource + action)
 * Returns Set(["devices.view", "files.download", ...])
 */
const getEffectivePermissionSet = async (userId) => {
  const keys = new Set();

  try {
    // 1) Role-based permissions
    const userRoles = await UserRole.findAll({
      where: { user_id: userId },
      raw: true,
    });

    const roleIds = userRoles.map((ur) => ur.role_id);
    if (roleIds.length) {
      const rolePerms = await RolePermission.findAll({
        where: { role_id: { [Op.in]: roleIds } },
        raw: true,
      });

      const permIds = rolePerms.map((rp) => rp.permission_id);
      if (permIds.length) {
        const perms = await Permission.findAll({
          where: { id: { [Op.in]: permIds } },
          raw: true,
        });

        perms.forEach((p) => {
          if (p.key) keys.add(p.key); // e.g. "devices.view"
        });
      }
    }

    // 2) User overrides
    const overrides = await UserPermission.findAll({
      where: { userId, allowed: true },
      raw: true,
    });

    overrides.forEach((u) => {
      if (u.resource && u.action) {
        keys.add(buildPermissionKey(u.resource, u.action));
      }
    });
  } catch (err) {
    logger.error('Error building effective permission set:', err);
  }

  return keys;
};

/**
 * User JWT auth
 */
const authenticateToken = async (req, res, next) => {
  try {
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
        code: 'AUTH_REQUIRED',
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
          code: 'TOKEN_EXPIRED',
        });
      }

      logger.error('Token verification failed', { error: err.message });
      return res.status(401).json({
        success: false,
        error: 'Invalid token',
        code: 'TOKEN_INVALID',
      });
    }

    // Get user from database
    const user = await User.findByPk(decoded.userId);
    if (!user) {
      logger.warn('User not found', { userId: decoded.userId });
      return res.status(401).json({
        success: false,
        error: 'User not found',
        code: 'USER_NOT_FOUND',
      });
    }

    if (!user.isActive) {
      logger.warn('User account is inactive', { userId: user.id });
      return res.status(403).json({
        success: false,
        error: 'Account is inactive',
        code: 'ACCOUNT_INACTIVE',
      });
    }

    // Attach user (plain object) to request
    req.user = user.get({ plain: true });

    next();
  } catch (error) {
    logger.error('Token verification failed:', error);
    return res.status(403).json({
      error: 'Invalid token',
      code: 'TOKEN_INVALID',
    });
  }
};

/**
 * Device JWT auth (unchanged in structure, just uses Device model)
 */
const authenticateDevice = async (req, res, next) => {
  const requestId = req.requestId || 'unknown';
  logger.info(`[${requestId}] Authenticating device`);

  try {
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
        method: req.method,
      });
      return res.status(401).json({
        success: false,
        error: 'Device token required',
        code: 'DEVICE_TOKEN_REQUIRED',
      });
    }

    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'your-secret-key'
      );

      const device = await Device.findOne({
        where: {
          deviceId: decoded.deviceId,
          status: { [Op.ne]: 'banned' },
        },
      });

      if (!device) {
        logger.warn(`[${requestId}] Device not found or banned`, {
          deviceId: decoded.deviceId,
        });
        return res.status(401).json({
          success: false,
          error: 'Device not registered or access denied',
          code: 'DEVICE_NOT_FOUND',
        });
      }

      await device.update({
        lastSeen: new Date(),
        ipAddress: req.ip,
      });

      req.device = device.get({ plain: true });
      req.deviceId = decoded.deviceId;

      return next();
    } catch (err) {
      logger.error(`[${requestId}] Device token verification failed:`, err);
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          error: 'Device token expired',
          code: 'DEVICE_TOKEN_EXPIRED',
        });
      }
      return res.status(401).json({
        success: false,
        error: 'Invalid device token',
        code: 'DEVICE_TOKEN_INVALID',
      });
    }
  } catch (error) {
    logger.error(`[${requestId}] Device authentication error:`, error);
    return res.status(500).json({
      success: false,
      error: 'Device authentication failed',
      code: 'AUTH_FAILED',
    });
  }
};

/**
 * Legacy admin flag (using User.role enum)
 */
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      error: 'Admin access required',
      code: 'ADMIN_REQUIRED',
    });
  }
  next();
};

/**
 * Role guard using User.role enum
 */
const requireRole = (...allowedRoles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Authentication required',
      code: 'AUTH_REQUIRED',
    });
  }
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({
      error: 'Insufficient role',
      code: 'ROLE_FORBIDDEN',
    });
  }
  next();
};

/**
 * Permission guard:
 *   resource, action => compares to Permission.key = "resource.action"
 */
const requirePermission = (resource, action) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication required',
          code: 'AUTH_REQUIRED',
        });
      }

      // Admin gets full access
      if (req.user.role === 'admin') {
        return next();
      }

      if (!req.effectivePermissionSet) {
        req.effectivePermissionSet = await getEffectivePermissionSet(
          req.user.id
        );
      }

      const key = buildPermissionKey(resource, action);

      if (req.effectivePermissionSet.has(key)) {
        return next();
      }

      return res.status(403).json({
        error: 'Permission denied',
        code: 'PERMISSION_DENIED',
        details: { resource, action },
      });
    } catch (err) {
      logger.error('RBAC permission check failed:', err);
      return res.status(500).json({
        error: 'Permission check failed',
        code: 'PERMISSION_CHECK_ERROR',
      });
    }
  };
};

/**
 * Optional auth (no error on missing/invalid token)
 */
const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token =
    authHeader && authHeader.startsWith('Bearer ')
      ? authHeader.split(' ')[1]
      : null;

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findByPk(decoded.userId);
      if (user && user.isActive) {
        req.user = user.get({ plain: true });
      }
    } catch (error) {
      logger.debug('Optional auth failed:', error.message);
    }
  }

  next();
};

module.exports = {
  authenticateToken,
  authenticateDevice,
  requireAdmin,
  requireRole,
  requirePermission,
  optionalAuth,
};
