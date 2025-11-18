const { Sequelize } = require('sequelize');
const config = require('../tests/test-config');
const logger = require('../utils/logger');

// Set up SQLite in-memory database for testing
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: config.db.storage, // Use in-memory SQLite
  logging: config.db.logging ? msg => logger.debug(msg) : false,
  define: {
    timestamps: true,
    paranoid: true, // Enable soft deletes
    underscored: true, // Use snake_case for database fields
    freezeTableName: true,
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  // Disable foreign key checks in test environment
  // This helps with test isolation
  dialectOptions: {
    // SQLite specific options
  },
  // Disable SQL logging in test environment
  logging: false
});

// Test the database connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    logger.info('Test database connection has been established successfully.');
    return true;
  } catch (error) {
    logger.error('Unable to connect to the test database:', error);
    throw error;
  }
};

// Clear the database (drop all tables)
const clearDatabase = async () => {
  try {
    // Get all models
    const models = sequelize.models;
    
    // Drop all tables in reverse order to handle foreign key constraints
    const modelNames = Object.keys(models).reverse();
    
    for (const modelName of modelNames) {
      const model = models[modelName];
      await model.drop({ cascade: true, force: true });
    }
    
    // Re-sync all models
    await sequelize.sync({ force: true });
    
    return true;
  } catch (error) {
    logger.error('Error clearing test database:', error);
    throw error;
  }
};

module.exports = {
  sequelize,
  testConnection,
  clearDatabase,
  sync: async (options = {}) => {
    // Always force sync in test environment
    const syncOptions = { ...options, force: true };
    return sequelize.sync(syncOptions);
  },
  close: async () => {
    try {
      await sequelize.close();
      return true;
    } catch (error) {
      logger.error('Error closing test database connection:', error);
      throw error;
    }
  }
};
