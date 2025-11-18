const logger = require('../utils/logger');

/**
 * @typedef {import('express').Request} Request
 * @typedef {import('express').Response} Response
 * @typedef {import('express').NextFunction} NextFunction
 * 
 * @typedef {Object} Logger
 * @property {Function} logRequest - Logs HTTP requests
 * @property {Function} logApiCall - Logs API call analytics
 * @property {Function} logError - Logs errors
 * @property {Function} logAuth - Logs authentication events
 * @property {Function} logDeviceActivity - Logs device activity
 * @property {Function} logCommand - Logs command execution
 * @property {Function} logFileOperation - Logs file operations
 * @property {Function} logDatabase - Logs database operations
 * @property {Function} logSocket - Logs socket events
 * 
 * @type {Logger}
 */
const typedLogger = logger;

/**
 * Enhanced logging middleware for comprehensive server analysis
 * Tracks all requests, responses, and performance metrics
 */

// Request timing middleware
const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  
  // Store original end function
  const originalEnd = res.end;
  
  // Override res.end to capture response time
  res.end = function(chunk, encoding) {
    const responseTime = Date.now() - startTime;
    
    // Log the request with detailed information
    typedLogger.logRequest(req, res, responseTime);
    
    // Log API call analytics
    const endpoint = req.route ? req.route.path : req.path;
    const success = res.statusCode < 400;
    const errorCode = success ? null : res.statusCode;
    const deviceId = req.body?.deviceId || req.query?.deviceId || req.headers['x-device-id'] || 'unknown';
    
    typedLogger.logApiCall(endpoint, req.method, deviceId, success, responseTime, errorCode);
    
    // Call original end function
    originalEnd.call(this, chunk, encoding);
  };
  
  next();
};

// Error logging middleware
const errorLogger = (err, req, res, next) => {
  const context = {
    method: req.method,
    url: req.url,
    path: req.path,
    query: req.query,
    params: req.params,
    body: req.body,
    headers: {
      'user-agent': req.get('User-Agent'),
      'content-type': req.get('Content-Type'),
      'x-forwarded-for': req.get('X-Forwarded-For')
    },
    ip: req.ip || req.connection.remoteAddress,
    deviceId: req.body?.deviceId || req.query?.deviceId || 'unknown'
  };
  
  typedLogger.logError(err, context);
  next(err);
};

// Authentication logging middleware
const authLogger = (req, res, next) => {
  const originalJson = res.json;
  
  res.json = function(data) {
    // Check if this is an auth-related endpoint
    const isAuthEndpoint = req.path.includes('/auth') || 
                          req.path.includes('/login') || 
                          req.path.includes('/token');
    
    if (isAuthEndpoint) {
      const success = res.statusCode < 400;
      const deviceId = req.body?.deviceId || req.query?.deviceId || 'unknown';
      const authType = req.path.includes('/login') ? 'login' : 
                      req.path.includes('/token') ? 'token_refresh' : 
                      req.path.includes('/logout') ? 'logout' : 'auth';
      
      const error = success ? null : new Error(data?.message || 'Authentication failed');
      
      typedLogger.logAuth(
        authType,
        deviceId,
        success,
        req.ip || req.connection.remoteAddress,
        req.get('User-Agent'),
        error
      );
    }
    
    originalJson.call(this, data);
  };
  
  next();
};

// Device activity tracking middleware
const deviceActivityLogger = (req, res, next) => {
  const deviceId = req.body?.deviceId || req.query?.deviceId || req.headers['x-device-id'];
  
  if (deviceId && deviceId !== 'unknown') {
    const activity = `${req.method} ${req.path}`;
    const metadata = {
      endpoint: req.path,
      method: req.method,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress,
      contentType: req.get('Content-Type'),
      contentLength: req.get('Content-Length')
    };
    
    typedLogger.logDeviceActivity(deviceId, activity, metadata);
  }
  
  next();
};

// Command execution logging helper
const logCommandExecution = (deviceId, commandType, commandData, success, executionTime, error = null) => {
  typedLogger.logCommand(deviceId, commandType, commandData, success, executionTime, error);
};

// File operation logging helper
const logFileOperation = (deviceId, operation, filename, fileSize, success, error = null) => {
  typedLogger.logFileOperation(deviceId, operation, filename, fileSize, success, error);
};

// Database operation logging helper
const logDatabaseOperation = (operation, table, recordId, success, queryTime, error = null) => {
  typedLogger.logDatabase(operation, table, recordId, success, queryTime, error);
};

// Socket.IO logging helper
const logSocketEvent = (event, socketId, deviceId, data = {}) => {
  typedLogger.logSocket(event, socketId, deviceId, data);
};

module.exports = {
  requestLogger,
  errorLogger,
  authLogger,
  deviceActivityLogger,
  logCommandExecution,
  logFileOperation,
  logDatabaseOperation,
  logSocketEvent,
  logger
};
