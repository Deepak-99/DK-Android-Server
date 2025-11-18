const { sequelize } = require('../config/database');
const logger = require('./logger');

/**
 * Ensures the is_active column exists in the users table and sets default values
 * This should be called during server startup or before user operations
 */
async function ensureIsActiveColumn() {
  try {
    // Check if the is_active column exists
    const [results] = await sequelize.query(
      `SELECT COLUMN_NAME 
       FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = '${sequelize.config.database}' 
       AND TABLE_NAME = 'users' 
       AND COLUMN_NAME = 'is_active'`
    );

    if (results.length === 0) {
      // Add the is_active column if it doesn't exist
      logger.info('Adding is_active column to users table...');
      await sequelize.query(
        'ALTER TABLE users ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE',
        { raw: true }
      );
      logger.info('Successfully added is_active column to users table');
    }

    // Ensure all existing users are marked as active
    logger.info('Ensuring all users are marked as active...');
    const [updateResult] = await sequelize.query(
      'UPDATE users SET is_active = TRUE WHERE is_active IS NULL OR is_active = FALSE',
      { raw: true }
    );

    logger.info(`Updated ${updateResult?.affectedRows || 0} users to be active`);
  } catch (error) {
    logger.error('Error ensuring is_active column:', error);
    throw error;
  }
}

/**
 * Middleware to ensure user is active
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
