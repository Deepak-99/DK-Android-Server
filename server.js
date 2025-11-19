// server.js
// Cleaned and stabilized server bootstrap with Socket.IO and WebSocketService wiring

console.log('🔍 Server.js is being loaded...');

const http = require('http');
const path = require('path');
const express = require('express');
const { Server } = require('socket.io');

// Load environment variables first
console.log('📝 Loading environment variables...');
require('dotenv').config();

// Log some important environment variables
console.log('⚙️  Environment:', process.env.NODE_ENV || 'development');
console.log('📁 Current directory:', process.cwd());

// Log environment variables (without sensitive data)
console.log('🔑 Environment variables:', {
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  DB_HOST: process.env.DB_HOST,
  DB_PORT: process.env.DB_PORT,
  DB_NAME: process.env.DB_NAME,
  DB_USER: process.env.DB_USER,
  DB_DIALECT: process.env.DB_DIALECT
});

// Core dependencies
console.log('📦 Loading core dependencies...');

// Add debug logs for WebSocketService
console.log('🔍 Loading WebSocketService...');
let WebSocketService;
try {
  WebSocketService = require('./services/WebSocketService');
  console.log('✅ WebSocketService module loaded successfully');
} catch (wsError) {
  console.error('❌ Failed to load WebSocketService:', wsError);
  throw wsError;
}
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./docs/swagger');
const YAML = require('yamljs');

console.log('🔌 Loading database configuration...');
let sequelize;
try {
  const dbConfig = require('./config/database');
  sequelize = dbConfig.sequelize;
  console.log('✅ Database configuration loaded');
} catch (error) {
  console.error('❌ Failed to load database configuration:', error);
  process.exit(1);
}

console.log('\n=== 🚀 Initializing Express app ===');
const app = express();
console.log('✅ Express app created');

console.log('\n=== 🌐 Creating HTTP server ===');
const server = http.createServer(app);
console.log('✅ HTTP server created');

const PORT = process.env.PORT || 3000;
console.log(`📡 Server will run on port: ${PORT}`);

// Initialize Socket.IO
console.log('\n=== 🔌 Initializing Socket.IO ===');
let io;
let webSocketService;

try {
    io = new Server(server, {
        cors: { origin: '*', methods: ['GET', 'POST'] }
    });
    webSocketService = new WebSocketService(io);
    console.log('✅ WebSocket service initialized');
} catch (ioError) {
    console.error('❌ Failed to initialize Socket.IO:', ioError);
    throw ioError;
}

console.log('\n=== 🔍 Checking application state ===');
console.log('✅ All services initialized successfully');
console.log('🔄 Starting HTTP server...');

// Make WebSocket service accessible in routes
app.set('webSocketService', webSocketService);
app.set('io', io);

// Debug configuration
const DEBUG_CONFIG = {
  logRequests: true,
  logResponses: true,
  logHeaders: false, // Set to true to log all headers
  logBody: true,
  logQuery: true,
  logParams: true
};

// Set process title for easier identification
process.title = 'hawkshaw-server';

// Import the configured Winston logger
const logger = require('./utils/logger');
const { ensureIsActiveColumn } = require('./utils/syncHelpers');

// Create log methods with consistent interface
const debug = (...args) => logger.debug(...args);
const info = (...args) => logger.info(...args);
const warn = (...args) => logger.warn(...args);
const error = (...args) => logger.error(...args);

// Log environment info
info('='.repeat(80));
info('STARTING HAWKSHAW SERVER');
info('='.repeat(80));
info(`Node.js version: ${process.version}`);
info(`Platform: ${process.platform} ${process.arch}`);
info(`Environment: ${process.env.NODE_ENV || 'development'}`);
info(`Port: ${PORT}`);
info('='.repeat(80) + '\n');

debug('Debug logging is enabled');

// Security middleware
debug('Initializing security middleware');
try {
  // Configure helmet with security best practices
  const helmetConfig = {
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        'default-src': ["'self'"],
        'script-src': [
          "'self'",
          'https://cdn.jsdelivr.net',
          'https://code.jquery.com',
          'https://stackpath.bootstrapcdn.com',
          'https://cdnjs.cloudflare.com',
          'https://use.fontawesome.com',
          "'unsafe-inline'",
          "'unsafe-eval'"
        ],
        'script-src-elem': [
          "'self'",
          'https://cdn.jsdelivr.net',
          'https://code.jquery.com',
          'https://stackpath.bootstrapcdn.com',
          'https://cdnjs.cloudflare.com',
          'https://use.fontawesome.com',
          "'unsafe-inline'"
        ],
        'style-src': [
          "'self'",
          'https://cdn.jsdelivr.net',
          'https://fonts.googleapis.com',
          'https://stackpath.bootstrapcdn.com',
          'https://cdnjs.cloudflare.com',
          'https://use.fontawesome.com',
          "'unsafe-inline'"
        ],
        'style-src-elem': [
          "'self'",
          'https://cdn.jsdelivr.net',
          'https://fonts.googleapis.com',
          'https://stackpath.bootstrapcdn.com',
          'https://cdnjs.cloudflare.com',
          'https://use.fontawesome.com',
          "'unsafe-inline'"
        ],
        'img-src': ["'self'", 'data:', 'https:'],
        'font-src': [
          "'self'",
          'https://cdn.jsdelivr.net',
          'https://fonts.gstatic.com',
          'https://stackpath.bootstrapcdn.com',
          'https://cdnjs.cloudflare.com',
          'https://use.fontawesome.com',
          'data:'
        ],
        'connect-src': [
          "'self'",
          'ws:',
          'wss:',
          'http://localhost:3000',
          'https://cdn.jsdelivr.net',
          'http://localhost:3000/api',
          'ws://localhost:3000/socket.io',
          'https://cdnjs.cloudflare.com',
          'https://use.fontawesome.com'
        ]
      }
    },
    crossOriginEmbedderPolicy: false, // Required for some CDN resources
    crossOriginOpenerPolicy: false,   // Required for some CDN resources
    crossOriginResourcePolicy: { policy: "cross-origin" }
  };

  app.use(helmet(helmetConfig));

  // Add security headers for module scripts
  app.use((req, res, next) => {
    res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    next();
  });

  // CORS configuration
  const corsOptions = {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    exposedHeaders: ['Content-Range', 'X-Total-Count']
  };

  debug('CORS options:', JSON.stringify(corsOptions));
  app.use(cors(corsOptions));
  app.options('*', cors(corsOptions));

  // Rate limiting
  debug('Initializing rate limiting');
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: { error: 'Too many requests, please try again later.' }
  });

  // Apply rate limiting to all API routes
  app.use('/api/', apiLimiter);

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  debug('Security and middleware initialization completed successfully');
} catch (err) {
  error('Failed to initialize middleware:', err);
  throw err;
}

// Configure static file serving with proper MIME types
const staticOptions = {
  setHeaders: (res, path) => {
    // Set MIME type for .js files to application/javascript
    if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    } else if (path.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    } else if (path.endsWith('.json')) {
      res.setHeader('Content-Type', 'application/json');
    } else if (path.endsWith('.png')) {
      res.setHeader('Content-Type', 'image/png');
    } else if (path.endsWith('.jpg') || path.endsWith('.jpeg')) {
      res.setHeader('Content-Type', 'image/jpeg');
    } else if (path.endsWith('.gif')) {
      res.setHeader('Content-Type', 'image/gif');
    } else if (path.endsWith('.svg')) {
      res.setHeader('Content-Type', 'image/svg+xml');
    } else if (path.endsWith('.woff')) {
      res.setHeader('Content-Type', 'font/woff');
    } else if (path.endsWith('.woff2')) {
      res.setHeader('Content-Type', 'font/woff2');
    } else if (path.endsWith('.ttf')) {
      res.setHeader('Content-Type', 'font/ttf');
    } else if (path.endsWith('.eot')) {
      res.setHeader('Content-Type', 'application/vnd.ms-fontobject');
    } else if (path.endsWith('.otf')) {
      res.setHeader('Content-Type', 'font/otf');
    }

    // Add security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
  }
};

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public'), staticOptions));

// Serve admin files with proper MIME types
app.use('/admin', express.static(path.join(__dirname, 'public', 'admin'), staticOptions));

// Mount API routes
const authRouter = require('./routes/auth');
const devicesRouter = require('./routes/devices');
const dashboardRouter = require('./routes/dashboard');

// Mount API routes with /api prefix
app.use('/api/auth', authRouter);
app.use('/api/devices', devicesRouter);
app.use('/api/dashboard', dashboardRouter);

// Root route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to Hawkshaw API',
    documentation: '/api-docs',
    version: '1.0.0',
    status: 'running',
    endpoints: [
      { path: '/api/auth', description: 'Authentication endpoints' },
      { path: '/api/devices', description: 'Device management endpoints' },
      { path: '/api-docs', description: 'API documentation' }
    ]
  });
});

// API Test Route
app.get('/api/test', (req, res) => {
  debug('Test route hit');
  res.json({
    success: true,
    message: 'Test route is working',
    timestamp: new Date().toISOString()
  });
});

// Request logging middleware
app.use((req, res, next) => {
  const requestId = Math.random().toString(36).substring(2, 10);
  const start = Date.now();
  req.requestId = requestId;

  // Log request start
  debug(`[${requestId}] ====== INCOMING REQUEST ======`);
  debug(`[${requestId}] ${req.method} ${req.originalUrl}`);

  // Log headers if enabled
  if (DEBUG_CONFIG.logHeaders) {
    debug(`[${requestId}] Headers:`, JSON.stringify(req.headers, null, 2));
  }

  // Log query parameters if present and enabled
  if (DEBUG_CONFIG.logQuery && Object.keys(req.query).length > 0) {
    debug(`[${requestId}] Query Parameters:`, JSON.stringify(req.query, null, 2));
  }

  // Log route parameters if present and enabled
  if (DEBUG_CONFIG.logParams && Object.keys(req.params).length > 0) {
    debug(`[${requestId}] Route Parameters:`, JSON.stringify(req.params, null, 2));
  }

  // Response interception for logging
  const originalSend = res.send;
  let responseBody;

  res.send = function(body) {
    responseBody = body;
    return originalSend.apply(res, arguments);
  };

  // Log response when request is complete
  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;
    const contentLength = res.get('Content-Length') || 0;
    const logMessage = `[${requestId}] ${req.method} ${req.originalUrl} ${statusCode} ${duration}ms ${contentLength}b - ${req.ip}`;

    // Log basic request info
    debug(`[${requestId}] ====== REQUEST COMPLETE ======`);
    debug(`[${requestId}] ${req.method} ${req.originalUrl}`);
    debug(`[${requestId}] Status: ${statusCode}`);
    debug(`[${requestId}] Duration: ${duration}ms`);

    // Log response headers if enabled
    if (DEBUG_CONFIG.logHeaders) {
      debug(`[${requestId}] Response Headers:`, JSON.stringify(res.getHeaders(), null, 2));
    }

    // Log response body if enabled
    if (DEBUG_CONFIG.logBody && responseBody) {
      try {
        const body = typeof responseBody === 'string' ? JSON.parse(responseBody) : responseBody;
        debug(`[${requestId}] Response Body:`, JSON.stringify(body, null, 2));
      } catch (e) {
        debug(`[${requestId}] Response Body:`, responseBody);
      }
    }

    // Log based on status code
    if (statusCode >= 500) {
      error(logMessage);
    } else if (statusCode >= 400) {
      warn(logMessage);
    } else {
      info(logMessage);
    }

    debug(`[${requestId}] ====== END REQUEST ======\n`);
  });

  next();
});

// API routes
app.use('/api/auth', authRouter);
app.use('/api/devices', devicesRouter);
app.use('/api/dashboard', dashboardRouter);

// Admin route - serve the admin login page
app.get('/admin*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/admin/index.html'));
});

// 404 handler
app.use((req, res) => {
  warn(`404 - ${req.method} ${req.originalUrl} - Route not found`);
  res.status(404).json({
    success: false,
    error: 'API endpoint not found'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  // Log the error
  logger.error('Unhandled error:', {
    error: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    body: req.body,
    params: req.params,
    query: req.query,
    ip: req.ip,
    headers: req.headers
  });

  // Send error response
  res.status(err.status || 500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Database connection with enhanced logging and timeouts
async function connectToDatabase() {
    const startTime = Date.now();
    console.log('\n=== 🔌 DATABASE CONNECTION ===');
    console.log('⏱️  Starting database connection...');

    // Set a timeout for the entire database connection process
    const connectionTimeout = 30000; // 30 seconds
    console.log(`⏱️  Connection timeout set to ${connectionTimeout / 1000} seconds`);

    let timeoutId;
    const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
            const error = new Error(`Database connection timed out after ${connectionTimeout / 1000} seconds`);
            console.error('\n❌ ' + error.message);
            console.error('💡 Possible causes:');
            console.error('- Database server is not running');
            console.error('- Incorrect database credentials');
            console.error('- Network connectivity issues');
            console.error('- Firewall blocking the connection');
            reject(error);
        }, connectionTimeout);
    });

    try {
        // Run the connection with timeout
        await Promise.race([
            (async () => {
                try {
                    // 1. Test basic connection
                    console.log('\n1️⃣  Testing database connection...');
                    const authStart = Date.now();
                    await sequelize.authenticate();
                    console.log(`✅ Authentication successful (${Date.now() - authStart}ms)`);

                    // 2. Sync models
                    console.log('\n2️⃣  Syncing database models...');
                    const syncStart = Date.now();
                    const syncOptions = {
                        alter: false,
                        logging: (msg) => console.log(`   [DB SYNC] ${msg}`),
                        // Add retry logic for sync
                        retry: {
                            max: 3,
                            timeout: 10000 // 10 seconds per retry
                        }
                    };

                    await sequelize.sync(syncOptions);
                    console.log(`✅ Models synced (${Date.now() - syncStart}ms)`);

                    // 3. Ensure indexes
                    try {
                        console.log('\n3️⃣  Verifying database indexes...');
                        const indexStart = Date.now();
                        const {ensureDeviceIdIndex} = require('./config/database');
                        await ensureDeviceIdIndex();
                        console.log(`✅ Indexes verified (${Date.now() - indexStart}ms)`);
                    } catch (indexError) {
                        console.warn('⚠️  Warning: Could not verify indexes:', indexError.message);
                        // Continue even if index verification fails
                    }

                    const totalTime = Date.now() - startTime;
                    console.log(`\n✅ Database connection established successfully in ${totalTime}ms`);
                    clearTimeout(timeoutId);
                    return true;

                } catch (syncError) {
                    console.error('\n❌ Database operation failed:', syncError.message);
                    if (syncError.original) {
                        console.error('Original error:', {
                            code: syncError.original.code,
                            errno: syncError.original.errno,
                            sqlState: syncError.original.sqlState,
                            sqlMessage: syncError.original.sqlMessage
                        });
                    }
                    throw syncError;
                }
            })(),
            timeoutPromise
        ]);

        return true;

    } catch (error) {
        clearTimeout(timeoutId);
        console.error('\n❌ Database connection failed:', error.message);

        // Provide specific troubleshooting tips based on error
        if (error.original) {
            const {code, errno} = error.original;
            console.log('\n🔍 Troubleshooting tips:');

            if (code === 'ECONNREFUSED') {
                console.log('- Database server is not running or not accessible');
                console.log('- Verify database server is running on the specified host/port');
            } else if (code === 'ER_ACCESS_DENIED_ERROR') {
                console.log('- Invalid database credentials');
                console.log('- Check DB_USER and DB_PASSWORD in your .env file');
            } else if (code === 'ER_BAD_DB_ERROR') {
                console.log('- Database does not exist');
                console.log(`- Create the database: ${process.env.DB_NAME || 'hawkshaw_db'}`);
            } else if (code === 'ENOTFOUND') {
                console.log('- Could not resolve database hostname');
                console.log(`- Check DB_HOST in your .env file (current: ${process.env.DB_HOST || 'localhost'})`);
            }

            console.log('\n🔧 Check your database configuration in .env:');
            console.log(`DB_HOST=${process.env.DB_HOST || 'localhost'}`);
            console.log(`DB_PORT=${process.env.DB_PORT || '3306'}`);
            console.log(`DB_NAME=${process.env.DB_NAME || 'hawkshaw_db'}`);
            console.log(`DB_USER=${process.env.DB_USER || 'hawkshaw_user'}`);
        }
    }
    }

// Start the server
async function startServer() {
    try {
        await server.listen(PORT);
        info(`Server is running on port ${PORT}`);

        // Log all routes
        if (process.env.NODE_ENV !== 'production') {
            const routes = [];

            function printRoutes(layer, path = '') {
                if (layer.route) {
                    const methods = Object.keys(layer.route.methods).join(',').toUpperCase();
                    routes.push({ path: path + layer.route.path, methods });
                } else if (layer.name === 'router') {
                    layer.handle.stack.forEach(stack => printRoutes(stack, path));
                } else if (layer.regexp) {
                    // This handles mounted routers
                    const route = (layer.regexp + '').split(' ')[0];
                    if (route !== '/^\\/?(?=\/|$)/i') {
                        layer.handle.stack.forEach(stack => printRoutes(stack, path + route));
                    }
                }
            }

            app._router.stack.forEach(layer => printRoutes(layer));

            info('Available routes:');
            console.table(routes);
        }
    } catch (error) {
        error('Failed to start server:', error);
        process.exit(1);
    }
}
// Handle process termination
        function gracefulShutdown() {
            console.log('Shutting down gracefully...');

            // Close the server
            server.close(async () => {
                console.log('Server closed');

                // Close database connection if exists
                if (sequelize) {
                    try {
                        await sequelize.close();
                        console.log('Database connection closed');
                    } catch (dbError) {
                        console.error('Error closing database connection:', dbError);
                    }
                }

                process.exit(0);
            });

            // Force shutdown after 5 seconds
            setTimeout(() => {
                console.error('Could not close connections in time, forcefully shutting down');
                process.exit(1);
            }, 5000);
        }

// Handle signals
        process.on('SIGTERM', gracefulShutdown);
        process.on('SIGINT', gracefulShutdown);

// Handle uncaught exceptions
process.on('uncaughtException', (err, origin) => {
    console.error('Uncaught Exception at:', origin);
    console.error('Error:', err);
    // Consider performing cleanup and shutting down
    process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // Application specific logging, throwing an error, or other logic here
});

// Start the application
        async function startApp() {
            try {
                console.log('Starting application...');
                await connectToDatabase();
                await startServer();

                console.log('Application started successfully');
            } catch (err) {
                console.error('Failed to start application:', err);
                process.exit(1);

            }
        }

// Start the app with proper error handling
startApp().catch(error => {
    console.error('Fatal error during application startup:', error);
    process.exit(1);
});

// Export the Express app for testing
      module.exports = {
          app,
          server,
          startApp,
          gracefulShutdown
      };
