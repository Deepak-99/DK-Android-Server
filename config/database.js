const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');
const path = require('path');
const fs = require('fs');

// Get current environment or default to development
const env = process.env.NODE_ENV || 'development';
const isTestEnvironment = env === 'test';

// Log environment info
logger.info(`Initializing database connection for ${env} environment`);

// Database configuration
const dbConfig = {
  username: process.env.DB_USER || 'hawkshaw_user',
  password: process.env.DB_PASSWORD || '8095@DKpassword',
  database: process.env.DB_NAME || (isTestEnvironment ? 'hawkshaw_db_test' : 'hawkshaw_db'),
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  dialect: process.env.DB_DIALECT || 'mysql',
  logging: isTestEnvironment ? console.log : (process.env.NODE_ENV === 'development' ? msg => logger.debug(msg) : false),
  // Add retry configuration
  retry: {
    max: 3, // Maximum number of retries
    timeout: 10000, // Timeout in ms
    backoffBase: 1000, // Initial backoff duration in ms
    backoffExponent: 1.5, // Exponent to increase backoff after each retry
  },
  // Add query timeout
  query_timeout: 5000, // 5 seconds query timeout
  // Add connection timeout
  connect_timeout: 10000, // 10 seconds connection timeout
  // Explicitly specify the authentication plugin
  dialectOptions: {
    authPlugins: {
      mysql_clear_password: () => () => {
        return Buffer.from(dbConfig.password + '\0');
      }
    },
    // Other dialect options
    decimalNumbers: true,
    supportBigNumbers: true,
    bigNumberStrings: true,
    connectTimeout: 60000, // Increase connection timeout to 60 seconds
    typeCast: function(field, next) {
      if (field.type === 'TINY' && field.length === 1) {
        return field.string() === '1'; // 1 = true, 0 = false
      }
      return next();
    }
  },
  // Database configuration with optimized settings
  define: {
    timestamps: true,
    underscored: true,
    freezeTableName: true,
    paranoid: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
    // Disable automatic index creation for foreign keys
    indexes: [],
    // Disable automatic foreign key constraint creation
    // We'll define them manually in migrations
    foreignKeys: false
  },
  dialectOptions: {
    decimalNumbers: true,
    supportBigNumbers: true,
    bigNumberStrings: true,
    typeCast: function(field, next) {
      if (field.type === 'TINY' && field.length === 1) {
        return field.string() === '1'; // 1 = true, 0 = false
      }
      return next();
    },
    connectTimeout: 60000 // Increase connection timeout to 60 seconds
  },
  pool: {
    max: parseInt(process.env.DB_POOL_MAX || '10'),
    min: parseInt(process.env.DB_POOL_MIN || '0'),
    acquire: parseInt(process.env.DB_POOL_ACQUIRE || '60000'),
    idle: parseInt(process.env.DB_POOL_IDLE || '10000')
  },
  retry: {
    max: 3, // Maximum number of retries
    match: [
      /SequelizeConnectionError/,
      /SequelizeConnectionRefusedError/,
      /SequelizeHostNotFoundError/,
      /SequelizeHostNotReachableError/,
      /SequelizeConnectionTimedOutError/
    ]
  }
};

// Create a connection without database specified
const tempSequelize = new Sequelize('', dbConfig.username, dbConfig.password, {
  host: dbConfig.host,
  port: dbConfig.port,
  dialect: dbConfig.dialect,
  logging: false
});

// Function to create database if it doesn't exist
async function initializeDatabase() {
  try {
    // Create database if it doesn't exist
    await tempSequelize.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\`;`);
    logger.info(`✅ Database ${dbConfig.database} is ready`);
    
    // Close the temporary connection
    await tempSequelize.close();
    
    return true;
  } catch (error) {
    logger.error('❌ Failed to initialize database:', error);
    throw error;
  }
}

// Initialize Sequelize with configuration
const sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, {
  host: dbConfig.host,
  port: dbConfig.port,
  dialect: dbConfig.dialect,
  logging: dbConfig.logging,
  // Connection pool configuration
  pool: {
    max: 5,
    min: 0,
    acquire: 30000, // Max time in ms that a connection can be acquired
    idle: 10000, // Max time in ms that a connection can be idle before being released
    evict: 1000 // The time interval in ms to check for idle connections
  },
  // Retry configuration
  retry: {
    max: 3, // Maximum number of retries
    timeout: 30000, // Timeout in ms
    backoffBase: 1000, // Initial backoff duration in ms
    backoffExponent: 1.5, // Exponent to increase backoff after each retry
  },
  // Query timeout
  query_timeout: 10000, // 10 seconds query timeout
  // Connection timeout
  connect_timeout: 10000, // 10 seconds connection timeout
  define: {
    ...dbConfig.define,
    // Enable automatic table creation and updates
    syncOnAssociation: true,
    // Don't drop tables in production
    freezeTableName: true,
    // Use snake_case for database columns
    underscored: true,
    // Add timestamps
    timestamps: true,
    // Add paranoid deletion
    paranoid: true,
    // Customize timestamp column names
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at'
  },
  dialectOptions: dbConfig.dialectOptions,
  pool: dbConfig.pool,
  sync: {
    force: false, // Don't drop tables on sync
    alter: {
      drop: false // Don't drop columns when altering tables
    }
  },
  hooks: {
    beforeSync: async (options) => {
      // Disable foreign key checks during sync
      await sequelize.query('SET FOREIGN_KEY_CHECKS = 0', { raw: true });
      logger.debug('🔧 Foreign key checks disabled for sync', { 
        timestamp: new Date().toISOString() 
      });
    },
    afterSync: async (options) => {
      // Re-enable foreign key checks after sync
      await sequelize.query('SET FOREIGN_KEY_CHECKS = 1', { raw: true });
      logger.debug('🔧 Foreign key checks re-enabled after sync', { 
        timestamp: new Date().toISOString() 
      });
    }
  }
});

// Function to ensure deviceId index exists in devices table
const ensureDeviceIdIndex = async () => {
  try {
    // Check if the index already exists
    const [results] = await sequelize.query(
      `SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS 
       WHERE table_schema = DATABASE() 
       AND table_name = 'devices' 
       AND index_name = 'idx_deviceId'`
    );

    // If index doesn't exist, create it
    if (results.length === 0) {
      logger.info('Creating index idx_deviceId on devices table...');
      await sequelize.query(
        'ALTER TABLE devices ADD INDEX idx_deviceId (deviceId)'
      );
      logger.info('Successfully created index idx_deviceId on devices table');
    }
  } catch (error) {
    logger.error('Error ensuring deviceId index exists:', error);
    throw error;
  }
};

// Test database connection and sync models
const testConnection = async () => {
  const connectionTimeout = setTimeout(() => {
    logger.error('Database connection timeout: Could not connect within 30 seconds');
    process.exit(1);
  }, 30000);

  try {
    const startTime = Date.now();
    logger.info('Initializing database connection...');
    
    // Create database if it doesn't exist
    logger.info('Checking database existence...');
    await initializeDatabase();
    
    // Test the connection with a short timeout
    logger.info('Authenticating database connection...');
    await sequelize.authenticate();
    logger.info('Database connection has been established successfully.');

    // Sync all models with the database (without forcing)
    logger.info('Syncing database models...');
    
    const syncOptions = {
      alter: false,
      logging: (msg) => logger.debug(`[DB SYNC] ${msg}`, { 
        timestamp: new Date().toISOString() 
      })
    };
    
    logger.debug(`Using sync options: ${JSON.stringify(syncOptions, null, 2)}`);
    await sequelize.sync(syncOptions);
    
    // Ensure deviceId index exists
    logger.info('Ensuring indexes...');
    await ensureDeviceIdIndex();
    
    clearTimeout(connectionTimeout);
    
    const syncDuration = ((Date.now() - startTime) / 1000).toFixed(2);
    logger.info(`Database synced successfully in ${syncDuration}s`, { 
      timestamp: new Date().toISOString(),
      database: dbConfig.database,
      host: dbConfig.host,
      port: dbConfig.port,
      dialect: dbConfig.dialect,
      syncDuration: `${syncDuration}s`
    });
    
    return {
      success: true,
      database: dbConfig.database,
      host: dbConfig.host,
      port: dbConfig.port,
      dialect: dbConfig.dialect,
      syncDuration: `${syncDuration}s`
    };
  } catch (error) {
    logger.error(`❌ Error syncing database '${dbConfig.database}': ${error.message}`, { 
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
};

// Load models dynamically from the models directory
const loadModels = () => {
  const modelsPath = path.join(__dirname, '../models');
  const models = {};
  
  // Skip if models directory doesn't exist
  if (!fs.existsSync(modelsPath)) {
    logger.warn(`Models directory not found at ${modelsPath}`);
    return models;
  }
  
  fs.readdirSync(modelsPath)
    .filter(file => {
      return (
        file.indexOf('.') !== 0 &&
        file !== 'index.js' &&
        file.slice(-3) === '.js'
      );
    })
    .forEach(file => {
      try {
        const model = require(path.join(modelsPath, file))(sequelize, Sequelize.DataTypes);
        models[model.name] = model;
      } catch (error) {
        logger.error(`Error loading model ${file}:`, error);
      }
    });

  // Associate models if associate method exists
  Object.keys(models).forEach(modelName => {
    if (models[modelName].associate) {
      models[modelName].associate(models);
    }
  });
  
  return models;

};

// Load all models
const models = loadModels();

// Initialize models
const db = {
  sequelize,
  Sequelize,
  ...models,
  testConnection,
  loadModels,
  ensureDeviceIdIndex
};

// Export the connection and models
module.exports = db;

// For easier destructuring
module.exports.User = models.User;
module.exports.Device = models.Device;
module.exports.ensureDeviceIdIndex = ensureDeviceIdIndex;

// Test the database connection when this module is loaded directly
if (require.main === module) {
  testConnection()
    .then(() => {
      logger.info('Database connection test completed successfully');
      process.exit(0);
    })
    .catch(err => {
      logger.error('Database connection test failed:', err);
      process.exit(1);
    });
}
