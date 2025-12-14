// server.js (restored full-featured, non-blocking, production-ready)
'use strict';

console.log('🔍 Server.js is being loaded...');

const fs = require('fs');
const path = require('path');
const http = require('http');
const express = require('express');
const { Server } = require('socket.io');
const WebSocket = require('ws');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// utils & logger (safe require)
const logger = require('./utils/logger');

// ----------------------------------------------------------------------------------
// Environment info
// ----------------------------------------------------------------------------------
console.log('📝 Loading environment variables...');
console.log('⚙️ Environment:', process.env.NODE_ENV || 'development');
console.log('📁 Current directory:', process.cwd());
console.log('🔑 Environment variables:', {
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  DB_HOST: process.env.DB_HOST,
  DB_PORT: process.env.DB_PORT,
  DB_NAME: process.env.DB_NAME,
  DB_USER: process.env.DB_USER,
  DB_DIALECT: process.env.DB_DIALECT
});

// ----------------------------------------------------------------------------------
// Prepare log directories (like original)
// ----------------------------------------------------------------------------------
try {
  const logDir = path.join(__dirname, 'logs');
  if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

  const webLogDir = path.join(__dirname, 'logs', 'websocket');
  if (!fs.existsSync(webLogDir)) fs.mkdirSync(webLogDir, { recursive: true });

  console.log('📂 Initializing log directories...');
  console.log('✅ File logging enabled');
} catch (err) {
  console.warn('⚠️ Could not initialize log directories:', err);
}

// ----------------------------------------------------------------------------------
// Load DB config (but do NOT sync here)
// ----------------------------------------------------------------------------------
let sequelize;
let models = {};
try {
  const db = require('./config/database');
  sequelize = db.sequelize;
  models = db;
  console.log('🔌 Loading database configuration...');
  console.log('✅ Database configuration loaded');
} catch (err) {
  console.error('❌ Failed to load database configuration:', err);
  // do not exit here; we'll fail later if DB is required
}

// ----------------------------------------------------------------------------------
// Express + server
// ----------------------------------------------------------------------------------
console.log('\n=== 🚀 Initializing Express app ===');
const app = express();
console.log('✅ Express app created');

console.log('\n=== 🌐 Creating HTTP server ===');
const server = http.createServer(app);
console.log('✅ HTTP server created');

const PORT = parseInt(process.env.PORT, 10) || 3000;

// Small helpers for logging
const debugLog = (...args) => (logger && logger.debug ? logger.debug(...args) : console.debug(...args));
const infoLog = (...args) => (logger && logger.info ? logger.info(...args) : console.info(...args));
const warnLog = (...args) => (logger && logger.warn ? logger.warn(...args) : console.warn(...args));
const errorLog = (...args) => (logger && logger.error ? logger.error(...args) : console.error(...args));

// Pretty startup banner
infoLog('='.repeat(80));
infoLog('STARTING HAWKSHAW SERVER');
infoLog('='.repeat(80));
infoLog(`Node.js version: ${process.version}`);
infoLog(`Platform: ${process.platform} ${process.arch}`);
infoLog(`Environment: ${process.env.NODE_ENV || 'development'}`);
infoLog(`Port: ${PORT}`);
infoLog('='.repeat(80) + '\n');

debugLog('Debug logging is enabled');

// ----------------------------------------------------------------------------------
// Security & Middleware (with original header handling)
// ----------------------------------------------------------------------------------
try {
  // Use helmet but disable CSP here to avoid double header issues in admin SPA
  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: false,
    crossOriginResourcePolicy: false
  }));

  // Remove COEP/COOP/COEP headers explicitly (original had this)
  app.use((req, res, next) => {
    res.removeHeader('Cross-Origin-Embedder-Policy');
    res.removeHeader('Cross-Origin-Opener-Policy');
    res.removeHeader('Cross-Origin-Resource-Policy');
    next();
  });

  const corsOptions = {
    origin: process.env.FRONTEND_URL || '*',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    exposedHeaders: ['Content-Range', 'X-Total-Count']
  };
  app.use(cors(corsOptions));
  app.options('*', cors(corsOptions));

  const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100, message: { error: 'Too many requests, please try again later.' } });
  app.use('/api/', apiLimiter);

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  debugLog('Security and middleware initialized');
} catch (err) {
  errorLog('Failed to initialize middleware:', err);
  throw err;
}

// ----------------------------------------------------------------------------------
// Request logger - restored from original (wrap res.send, compute durations, log response body lightly)
// ----------------------------------------------------------------------------------
app.use((req, res, next) => {
  const requestId = Math.random().toString(36).substring(2, 10);
  const start = Date.now();
  req.requestId = requestId;

  debugLog(`[${requestId}] ====== INCOMING REQUEST ======`);
  debugLog(`[${requestId}] ${req.method} ${req.originalUrl}`);

  if (req.query && Object.keys(req.query).length) {
    debugLog(`[${requestId}] Query:`, JSON.stringify(req.query));
  }

  if (req.body && Object.keys(req.body).length) {
    // avoid logging huge bodies
    try {
      const bodyPreview = JSON.stringify(req.body).slice(0, 2000);
      debugLog(`[${requestId}] Body preview:`, bodyPreview);
    } catch (e) {
      debugLog(`[${requestId}] Body: (could not stringify)`);
    }
  }

  const originalSend = res.send;
  let responseBody;
  res.send = function (body) {
    responseBody = body;
    return originalSend.apply(res, arguments);
  };

  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;
    const logMessage = `[${requestId}] ${req.method} ${req.originalUrl} ${statusCode} ${duration}ms - ${req.ip}`;

    if (statusCode >= 500) errorLog(logMessage);
    else if (statusCode >= 400) warnLog(logMessage);
    else infoLog(logMessage);

    if (responseBody && typeof responseBody !== 'undefined') {
      try {
        if (typeof responseBody === 'string') {
          debugLog(`[${requestId}] Response Body (string):`, responseBody.slice(0, 2000));
        } else {
          debugLog(`[${requestId}] Response Body:`, JSON.stringify(responseBody).slice(0, 2000));
        }
      } catch (e) {
        debugLog(`[${requestId}] Response Body: (could not stringify)`);
      }
    }

    debugLog(`[${requestId}] ====== END REQUEST ======\n`);
  });

  next();
});

// ----------------------------------------------------------------------------------
// Static assets (admin + public)
// ----------------------------------------------------------------------------------
const staticOptions = {
  setHeaders: (res /*, filePath */) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
  }
};
app.use(express.static(path.join(__dirname, 'public'), staticOptions));
app.use('/admin', express.static(path.join(__dirname, 'public', 'admin'), staticOptions));

// ----------------------------------------------------------------------------------
// Attach io placeholder to req (io will be set later)
// ----------------------------------------------------------------------------------
let io = null;
let webSocketService = null;
function attachIo(req, res, next) {
  req.io = req.app.get('io') || null;
  next();
}
app.use(attachIo);

// ----------------------------------------------------------------------------------
// Basic routes (keep original root and test routes)
// ----------------------------------------------------------------------------------
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to Hawkshaw API',
    documentation: '/api-docs',
    version: '1.0.0',
    status: 'running'
  });
});

app.get('/api/test', (req, res) => res.json({ success: true, message: 'Test route is working' }));

// ----------------------------------------------------------------------------------
// Admin SPA fallback (original behavior)
// ----------------------------------------------------------------------------------
app.get('/admin*', (req, res) => {
  const indexPath = path.join(__dirname, 'public', 'admin', 'index.html');
  res.sendFile(indexPath);
});

// ----------------------------------------------------------------------------------
// DB connect + sync helper (restored with ensureIsActiveColumn support)
// ----------------------------------------------------------------------------------
const { ensureIsActiveColumn } = (() => {
  try {
    return require('./utils/syncHelpers');
  } catch (e) {
    return { ensureIsActiveColumn: null };
  }
})();

async function connectToDatabase() {
  const connectionTimeout = setTimeout(() => {
    logger.error('Database connection timeout: Could not connect within 30 seconds');
    process.exit(1);
  }, 30000);

  try {
    const startTime = Date.now();
    logger.info('Initializing database connection...');

    // Create database if needed and then authenticate/sync
    if (sequelize && typeof sequelize.authenticate === 'function') {
      logger.info('Authenticating database connection...');
      await sequelize.authenticate();
    } else {
      throw new Error('Sequelize is not initialized');
    }

    logger.info('Syncing database models...');
    const syncOptions = {
      alter: false,
      logging: (msg) => logger.debug(`[DB SYNC] ${msg}`)
    };
    await sequelize.sync(syncOptions);

    // Ensure active column if provided
    if (typeof ensureIsActiveColumn === 'function') {
      try {
        await ensureIsActiveColumn();
        logger.info('ensureIsActiveColumn completed');
      } catch (err) {
        logger.warn('ensureIsActiveColumn failed (continuing):', err.message || err);
      }
    }

    clearTimeout(connectionTimeout);
    const syncDuration = ((Date.now() - startTime) / 1000).toFixed(2);
    logger.info(`Database synced successfully in ${syncDuration}s`, {
      database: process.env.DB_NAME,
      host: process.env.DB_HOST,
      port: process.env.DB_PORT
    });
    return true;
  } catch (error) {
    clearTimeout(connectionTimeout);
    logger.error(`Error syncing database: ${error.message}`, { stack: error.stack });
    throw error;
  }
}

// ----------------------------------------------------------------------------------
// Socket initialization (Socket.IO + raw WebSocket).
// WebSocketService required lazily here (after DB connection and after io exists)
// ----------------------------------------------------------------------------------
function initSocketIO() {
  // Create Socket.IO server bound to the http server
  io = new Server(server, { cors: { origin: process.env.FRONTEND_URL || '*', methods: ['GET', 'POST'] } });
  app.set('io', io);

  // Require and instantiate WebSocketService AFTER io exists (avoid circular require)
  try {
    const WebSocketServiceClass = require('./services/WebSocketService');
    webSocketService = new WebSocketServiceClass(io);
    app.set('webSocketService', webSocketService);
    console.log('✅ WebSocketService initialized');
  } catch (err) {
    console.warn('⚠️ WebSocketService failed to initialize:', err && err.message);
  }

  // Raw WebSocket (noServer)
  const rawWSS = new WebSocket.Server({ noServer: true });

  rawWSS.on('connection', (ws, req) => {
    console.log('🔌 Raw WebSocket connected:', req.url);
    // Optionally: attach listeners here
    ws.on('message', (msg) => {
      debugLog('RawWS message:', msg.toString().slice(0, 1000));
    });
  });

  // Install a top-level server upgrade handler once (FIX for freeze)
  server.on('upgrade', (req, socket, head) => {
    try {
      const { url } = req;

      // 1) RAW WebSocket (Admin Panel)
      if (url === '/ws' || url.startsWith('/ws?')) {
        rawWSS.handleUpgrade(req, socket, head, (ws) => {
          rawWSS.emit('connection', ws, req);
        });
        return;
      }

      // 2) Socket.IO Upgrade (handled internally by engine.io)
      if (url.startsWith('/socket.io/')) {
        return;
      }

      // 3) Unknown upgrade -> safely close
      socket.destroy();
    } catch (err) {
      console.error('Upgrade handler error:', err);
      socket.destroy();
    }
  });

  console.log('✅ Socket.IO and raw WebSocket upgrade handlers installed');
}

// ----------------------------------------------------------------------------------
// Lazy load and mount routers after DB connect to avoid blocking at module-load
// ----------------------------------------------------------------------------------
let mountedRoutes = false;
function mountRouters() {
  if (mountedRoutes) return;
  try {
    const authRouter = require('./routes/auth');
    const devicesRouter = require('./routes/devices');
    const dashboardRouter = require('./routes/dashboard');
    const rbacRouter = require('./routes/rbac');

    app.use('/api/auth', authRouter);
    app.use('/api/devices', devicesRouter);
    app.use('/api/dashboard', dashboardRouter);
    app.use('/api/rbac', rbacRouter);

    // stream & devicefs are mounted here too (they won't run DB queries at load)
    app.use('/api', require('./routes/stream'));
    app.use('/api/devices/:deviceId/fs', require('./routes/devicefs'));

    mountedRoutes = true;
    console.log('✅ Routers mounted');
  } catch (err) {
    console.error('Failed to mount routers:', err);
    throw err;
  }
}

// ----------------------------------------------------------------------------------
// Route printing utility (development only) — restored from original
// ----------------------------------------------------------------------------------
function printAvailableRoutes() {
  try {
    if (process.env.NODE_ENV === 'production') return;
    if (!app._router) return;

    const routes = [];
    function printRoutes(layer, base = '') {
      if (layer.route && layer.route.path) {
        const methods = Object.keys(layer.route.methods).join(',').toUpperCase();
        routes.push({ path: base + layer.route.path, methods });
      } else if (layer.name === 'router' && layer.handle && layer.handle.stack) {
        layer.handle.stack.forEach(l => printRoutes(l, base));
      } else if (layer.regexp && layer.handle && layer.handle.stack) {
        layer.handle.stack.forEach(stackItem => printRoutes(stackItem, base));
      }
    }
    app._router.stack.forEach(layer => printRoutes(layer));
    infoLog('Available routes:');
    console.table(routes);
  } catch (e) {
    debugLog('Could not print routes:', e);
  }
}

// ----------------------------------------------------------------------------------
// Graceful shutdown — restored from original (closes server, DB, websocketservice)
// ----------------------------------------------------------------------------------
async function gracefulShutdown() {
  console.log('Shutting down gracefully...');
  try {
    server.close(async (err) => {
      if (err) console.error('Error closing server:', err);
      else console.log('HTTP server closed');

      try {
        if (sequelize) {
          await sequelize.close();
          console.log('Database connection closed');
        }
      } catch (e) {
        console.error('Error closing DB connection:', e);
      }

      try {
        if (webSocketService && typeof webSocketService.shutdown === 'function') {
          await webSocketService.shutdown();
          console.log('WebSocketService shutdown complete');
        }
      } catch (e) {
        console.error('Error shutting down WebSocketService', e);
      }

      process.exit(0);
    });

    // Force exit if not closed within time
    setTimeout(() => {
      console.error('Forcing shutdown due to timeout');
      process.exit(1);
    }, 5000);
  } catch (e) {
    console.error('Graceful shutdown failed:', e);
    process.exit(1);
  }
}

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  setTimeout(() => process.exit(1), 100);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  setTimeout(() => process.exit(1), 100);
});

// ----------------------------------------------------------------------------------
// Start application: connect DB -> mount routers -> init sockets -> listen
// ----------------------------------------------------------------------------------
async function startApp() {
  try {
    console.log('Starting application...');

    // 1) DB connect & sync
    await connectToDatabase();

    // 2) mount routers (after DB is ready)
    mountRouters();

      // ----------------------------------------------------------------------------------
// 404 handler & final error handler (must be last)
// ----------------------------------------------------------------------------------
      app.use((req, res) => {
          warnLog(`404 - ${req.method} ${req.originalUrl}`);
          res.status(404).json({ success: false, error: 'API endpoint not found' });
      });

      app.use((err, req, res, next) => {
          logger.error('Unhandled error:', { error: err.message, stack: err.stack });
          res.status(err.status || 500).json({
              success: false,
              error: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message,
              stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
          });
      });

    // 3) initialize sockets & websocket service
    initSocketIO();

    // 4) start listening
    await new Promise((resolve, reject) => {
      server.listen(PORT, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });

    console.log(`✅ Server is running on port ${PORT}`);

    // Print routes in development
    printAvailableRoutes();

    console.log('Application started successfully');
  } catch (err) {
    console.error('Fatal error during application startup:', err);
    // allow logs to flush, then exit
    setTimeout(() => process.exit(1), 100);
  }
}

startApp().catch(err => {
  console.error('startApp failed:', err);
  process.exit(1);
});

// export for tests
module.exports = { app, server, startApp, gracefulShutdown };
