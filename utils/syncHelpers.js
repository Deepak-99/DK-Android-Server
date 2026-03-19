'use strict';

const logger = require('./logger');

/**
 * Ensures the is_active column exists in the users table
 * and sets default values if missing
 */
async function ensureIsActiveColumn() {
  try {
    // Lazy load to avoid circular dependency
    const sequelize = require('../config/database');

    logger.info('[SYNC] Checking is_active column in users table');

    const [results] = await sequelize.query(`
      SHOW COLUMNS FROM users LIKE 'is_active';
    `);

    if (!results || results.length === 0) {

      logger.info('[SYNC] is_active column missing → Adding column');

      await sequelize.query(`
        ALTER TABLE users 
        ADD COLUMN is_active BOOLEAN DEFAULT true;
      `);

      logger.info('[SYNC] is_active column added successfully');

    } else {

      logger.info('[SYNC] is_active column already exists');

    }

  } catch (error) {

    logger.error('[SYNC ERROR] Failed to ensure is_active column', {
      message: error.message,
      stack: error.stack
    });

  }
}

/**
 * Middleware to block inactive users
 */
function ensureUserActive(req, res, next) {

  if (req.user && req.user.isActive === false) {
    return res.status(403).json({
      success: false,
      error: 'Account is inactive',
      code: 'ACCOUNT_INACTIVE'
    });
  }

  next();
}

module.exports = {
  ensureIsActiveColumn,
  ensureUserActive
};