const winston = require('winston');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Create logs directory structure with absolute paths
const logDir = path.join(__dirname, '..', 'logs');
const dailyDir = path.join(logDir, 'daily');
const errorDir = path.join(logDir, 'errors');
const analyticsDir = path.join(logDir, 'analytics');
const performanceDir = path.join(logDir, 'performance');

// Function to safely create directories
function ensureDirectoryExists(directory) {
  try {
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true, mode: 0o777 });
      console.log(`✅ Created directory: ${directory}`);
    }
    return true;
  } catch (error) {
    console.error(`❌ Failed to create directory ${directory}:`, error);
    return false;
  }
}

// Log directory creation status
console.log('📂 Initializing log directories...');
const dirs = [logDir, dailyDir, errorDir, analyticsDir, performanceDir];
const allDirsCreated = dirs.every(dir => {
  const success = ensureDirectoryExists(dir);
  if (!success) {
    console.error(`⚠️  Warning: Could not create directory: ${dir}`);
  }
  return success;
});

if (!allDirsCreated) {
  console.warn('⚠️  Some log directories could not be created. Logging to console only.');
}

// Helper function to get current date for log filenames
const getCurrentDate = () => new Date().toISOString().split('T')[0];

// Create the logger with console transport only initially
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
      winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss.SSS'
      }),
      winston.format.errors({ stack: true }),
      winston.format.json(),
      winston.format.printf(({ timestamp, level, message, ...meta }) => {
        return JSON.stringify({
          timestamp,
          level,
          message,
          pid: process.pid,
          hostname: os.hostname(),
          ...meta
        }, null, 0);
      })
  ),
  transports: [
    // Always include console transport
    new winston.transports.Console({
      format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
      )
    })
  ]
});

// Only add file transports if directories were created successfully
if (allDirsCreated) {
  try {
    // File transport for errors
    logger.add(new winston.transports.File({
      filename: path.join(errorDir, 'error.log'),
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 10
    }));
    
    // Combined log file
    logger.add(new winston.transports.File({
      filename: path.join(dailyDir, `${getCurrentDate()}.log`),
      maxsize: 10485760, // 10MB
      maxFiles: 30
    }));
    
    // Exception handler
    logger.exceptions.handle(
      new winston.transports.File({ 
        filename: path.join(errorDir, 'exceptions.log') 
      })
    );
    
    console.log('✅ File logging enabled');
  } catch (error) {
    console.error('❌ Failed to initialize file logging:', error);
    console.warn('⚠️  Falling back to console logging only');
  }
}

// Configure logger to not exit on handled exceptions
logger.exitOnError = false;

// Create performance logger
const performanceLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
  ),
  transports: [
    new winston.transports.File({
      filename: path.join(performanceDir, `performance-${getCurrentDate()}.log`),
      maxsize: 10485760, // 10MB
      maxFiles: 30
    })
  ]
});

// Create analytics logger
const analyticsLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
  ),
  transports: [
    new winston.transports.File({
      filename: path.join(analyticsDir, `analytics-${getCurrentDate()}.log`),
      maxsize: 10485760, // 10MB
      maxFiles: 30
    })
  ]
});

// Add helper methods to logger
Object.assign(logger, {
  // Log HTTP requests
  logRequest: function(req, res, responseTime) {
    const logData = {
      type: 'request',
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      timestamp: new Date().toISOString()
    };

    this.info('HTTP Request', logData);
    performanceLogger.info('Request Performance', logData);
  },

  // Log errors with context
  logError: function(error, context = {}) {
    const errorData = {
      type: 'error',
      message: error.message,
      stack: error.stack,
      name: error.name,
      ...context,
      timestamp: new Date().toISOString()
    };
    this.error('Error occurred', errorData);
  },

  // Log device activity
  logDeviceActivity: function(deviceId, activity, metadata = {}) {
    const activityData = {
      type: 'device_activity',
      deviceId,
      activity,
      ...metadata,
      timestamp: new Date().toISOString()
    };
    this.info('Device Activity', activityData);
    analyticsLogger.info('Device Activity Analytics', activityData);
  },

  // Log database operations
  logDatabase: function(operation, table, recordId, success, queryTime, error = null) {
    const dbLog = {
      type: 'database_operation',
      operation,
      table,
      recordId,
      success,
      queryTime,
      error: error ? error.message : null,
      timestamp: new Date().toISOString()
    };

    if (success) {
      this.info('Database Operation', dbLog);
    } else {
      this.error('Database Operation Failed', dbLog);
    }
  },

  // Log system metrics
  logSystemMetrics: function() {
    const metrics = {
      type: 'system_metrics',
      memory: process.memoryUsage(),
      uptime: process.uptime(),
      platform: os.platform(),
      arch: os.arch(),
      timestamp: new Date().toISOString()
    };
    this.debug('System Metrics', metrics);
    performanceLogger.info('System Performance', metrics);
  }
});

// Log startup
logger.info('Logger initialized', {
  type: 'system_startup',
  nodeVersion: process.version,
  platform: os.platform(),
  arch: os.arch()
});

// Log system metrics every 5 minutes
setInterval(() => {
  logger.logSystemMetrics();
}, 5 * 60 * 1000);

module.exports = logger;