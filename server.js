// server.js (corrected & stabilized)
// 'use strict' kept for safety
'use strict';

console.log('🔍 Server.js is being loaded...');

const http = require('http');
const path = require('path');
const express = require('express');
const { Server } = require('socket.io');
require('dotenv').config();

// Basic environment logging
console.log('📝 Loading environment variables...');
console.log('⚙️ Environment:', process.env.NODE_ENV || 'development');
console.log('📁 Current directory:', process.cwd());

// Keep printing non-sensitive env vars for debugging
console.log('🔑 Environment variables:', {
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  DB_HOST: process.env.DB_HOST,
  DB_PORT: process.env.DB_PORT,
  DB_NAME: process.env.DB_NAME,
  DB_USER: process.env.DB_USER,
  DB_DIALECT: process.env.DB_DIALECT
});

console.log('📦 Loading core dependencies...');

let WebSocketService;
try {
  // require the class only (do not instantiate until io exists)
  WebSocketService = require('./services/WebSocketService');
  console.log('✅ WebSocketService module required successfully');
} catch (wsError) {
  console.error('❌ Failed to require WebSocketService module:', wsError);
  throw wsError;
}

const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

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

const PORT = parseInt(process.env.PORT, 10) || 3000;
console.log(`📡 Server will run on port: ${PORT}`);

const logger = require('./utils/logger');
const { ensureIsActiveColumn } = require('./utils/syncHelpers');

const debug = (...args) => (logger && logger.debug ? logger.debug(...args) : console.debug(...args));
const info = (...args) => (logger && logger.info ? logger.info(...args) : console.info(...args));
const warn = (...args) => (logger && logger.warn ? logger.warn(...args) : console.warn(...args));
const error = (...args) => (logger && logger.error ? logger.error(...args) : console.error(...args));

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

// ---------- security + middleware ----------
// Helmet config: disable contentSecurityPolicy here to avoid accidental double headers.
// We'll set minimal safe headers manually (once) below.
try {
    const helmetConfig = {
        contentSecurityPolicy: false,
        crossOriginEmbedderPolicy: false,
        crossOriginOpenerPolicy: false,
        crossOriginResourcePolicy: false
    };

    app.use(helmet(helmetConfig));

// ❗ Remove ALL manual COEP/COOP headers
    app.use((req, res, next) => {
        res.removeHeader("Cross-Origin-Embedder-Policy");
        res.removeHeader("Cross-Origin-Opener-Policy");
        res.removeHeader("Cross-Origin-Resource-Policy");
        next();
    });

  const corsOptions = {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    exposedHeaders: ['Content-Range', 'X-Total-Count']
  };
  app.use(cors(corsOptions));
  app.options('*', cors(corsOptions));

  const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100, message: { error: 'Too many requests, please try again later.' } });
  app.use('/api/', apiLimiter);

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  debug('Security and middleware initialized');
} catch (err) {
  error('Failed to initialize middleware:', err);
  throw err;
}

// ---------- REQUEST LOGGER ----------
app.use((req, res, next) => {
  const requestId = Math.random().toString(36).substring(2, 10);
  const start = Date.now();
  req.requestId = requestId;

  debug(`[${requestId}] ====== INCOMING REQUEST ======`);
  debug(`[${requestId}] ${req.method} ${req.originalUrl}`);

  if (req.query && Object.keys(req.query).length) {
    debug(`[${requestId}] Query:`, JSON.stringify(req.query));
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

    if (statusCode >= 500) error(logMessage);
    else if (statusCode >= 400) warn(logMessage);
    else info(logMessage);

    if (responseBody && typeof responseBody !== 'undefined') {
      if (typeof responseBody === 'string') {
        // attempt to parse JSON for clean logging; if fails, log the raw string
        try {
          debug(`[${requestId}] Response Body:`, JSON.stringify(JSON.parse(responseBody), null, 2));
        } catch {
          debug(`[${requestId}] Response Body (raw string)`);
        }
      } else {
        debug(`[${requestId}] Response Body:`, JSON.stringify(responseBody, null, 2));
      }
    }

    debug(`[${requestId}] ====== END REQUEST ======\n`);
  });

  next();
});

// ---------- static (use default MIME handling; only add security header) ----------
const staticOptions = {
  setHeaders: (res /*, filePath */) => {
    // Avoid overriding JS MIME types — let Express/static determine correct types.
    // Keep security header only:
    res.setHeader('X-Content-Type-Options', 'nosniff');
  }
};

app.use(express.static(path.join(__dirname, 'public'), staticOptions));
app.use('/admin', express.static(path.join(__dirname, 'public', 'admin'), staticOptions));

// ---------- attach io to requests (uses app.get('io') at runtime) ----------
let io = null;
let webSocketService = null;
function attachIo(req, res, next) {
  // get io from app locals so we can attach even if initSocketIO runs later
  req.io = req.app.get('io') || null;
  next();
}
app.use(attachIo);

// ---------- routers (mount once, after request logger and static) ----------
const authRouter = require('./routes/auth');
const devicesRouter = require('./routes/devices');
const dashboardRouter = require('./routes/dashboard');

app.use('/api/auth', authRouter);
app.use('/api/devices', devicesRouter);
app.use('/api/dashboard', dashboardRouter);
app.use("/api", require("./routes/stream"));
app.use("/api/devices/:deviceId/fs", require("./routes/devicefs"));


// ---------- basic routes ----------
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

// ---------- admin SPA fallback ----------
app.get('/admin*', (req, res) => {
  const indexPath = path.join(__dirname, 'public', 'admin', 'index.html');
  res.sendFile(indexPath);
});

// ---------- 404 & error (error handler must be last) ----------
app.use((req, res) => {
  warn(`404 - ${req.method} ${req.originalUrl}`);
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

// ---------- DB connect helper ----------
async function connectToDatabase() {
  try {
    console.log('⏱️  Authenticating database connection...');
    await sequelize.authenticate();
    console.log('✅ Database authentication successful');

    console.log('⏱️  Syncing models (alter:false)...');
    await sequelize.sync({ alter: false });
    console.log('✅ Models synced');

    if (typeof ensureIsActiveColumn === 'function') {
      try {
        await ensureIsActiveColumn();
        console.log('✅ ensureIsActiveColumn completed');
      } catch (ensureErr) {
        console.warn('⚠️ ensureIsActiveColumn failed (continuing):', ensureErr.message || ensureErr);
      }
    }

    return true;
  } catch (err) {
    console.error('❌ Database connection failed:', err);
    throw err;
  }
}

// ---------- Socket.IO init (create io BEFORE server.listen; instantiate service safely) ----------
function initSocketIO() {
  // Create io bound to http server
  io = new Server(server, { cors: { origin: process.env.FRONTEND_URL || '*', methods: ['GET', 'POST'] } });

  // make io available via app
  app.set('io', io);

  webSocketService = new WebSocketService(io);
  app.set('webSocketService', webSocketService);

  console.log('✅ WebSocketService initialized');
}

//
// 🔥🔥🔥 RAW WEB SOCKET + SOCKET.IO MULTI-PROTOCOL UPGRADE
//
const WebSocket = require('ws');

// Raw WebSocket server (Admin)
const rawWSS = new WebSocket.Server({ noServer: true });

rawWSS.on('connection', (ws) => {
    console.log('🔌 Raw WebSocket /ws connected');
    server.on('upgrade', (req, socket, head) => {
        const {url} = req;

        // 1) RAW WebSocket (Admin Panel)
        if (url === '/ws' || url.startsWith('/ws?')) {
            rawWSS.handleUpgrade(req, socket, head, (ws) => {
                rawWSS.emit('connection', ws, req);
            });
            return; // IMPORTANT: stop further handling
        }

        // 2) Socket.IO Upgrade (handled internally by engine.io)
        if (url.startsWith('/socket.io/')) {
            // Do not manually handle upgrade
            return;
        }

        // 3) Unknown upgrade → safely close
        socket.destroy();
    })
});

//
// END MULTI-PROTOCOL WS SECTION
//


// ---------- listen helper (proper Promise wrapper) ----------
function listenAsync(port) {
  return new Promise((resolve, reject) => {
    server.listen(port, (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

// ---------- startup ----------
async function startApp() {
  try {
    console.log('Starting application...');
    // 1) DB first (so models exist for routes that may query DB during first requests)
    await connectToDatabase();

    // 2) Initialize Socket.IO and WebSocketService (before routes use req.io)
    initSocketIO();

    // 3) Start listening
    await listenAsync(PORT);
    console.log(`✅ Server is running on port ${PORT}`);

    // Optional: show available routes in non-production
    if (process.env.NODE_ENV !== 'production' && app._router) {
      try {
        const routes = [];
        function printRoutes(layer, base = '') {
          if (layer.route && layer.route.path) {
            const methods = Object.keys(layer.route.methods).join(',').toUpperCase();
            routes.push({ path: base + layer.route.path, methods });
          } else if (layer.name === 'router' && layer.handle && layer.handle.stack) {
            layer.handle.stack.forEach(l => printRoutes(l, base));
          } else if (layer.name === 'bound dispatch' && layer.route) {
            const methods = Object.keys(layer.route.methods).join(',').toUpperCase();
            routes.push({ path: base + layer.route.path, methods });
          } else if (layer.regexp && layer.handle && layer.handle.stack) {
            // mounted router
            layer.handle.stack.forEach(stackItem => printRoutes(stackItem, base));
          }
        }
        app._router.stack.forEach(layer => printRoutes(layer));
        info('Available routes:');
        console.table(routes);
      } catch (e) {
        debug('Could not print routes:', e);
      }
    }

    console.log('Application started successfully');
  } catch (err) {
    console.error('Fatal error during application startup:', err);
    // Wait a little to allow logs to flush
    setTimeout(() => process.exit(1), 100);
  }
}

// ---------- graceful shutdown ----------
function gracefulShutdown() {
  console.log('Shutting down gracefully...');
  server.close(async () => {
    console.log('Server closed');
    try {
      if (sequelize) await sequelize.close();
      console.log('Database connection closed');
    } catch (e) {
      console.error('Error closing DB', e);
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

  setTimeout(() => {
    console.error('Forcing shutdown due to timeout');
    process.exit(1);
  }, 5000);
}

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  // Allow logs to flush then exit
  setTimeout(() => process.exit(1), 100);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  setTimeout(() => process.exit(1), 100);
});

// Start
startApp().catch(err => {
  console.error('startApp failed:', err);
  process.exit(1);
});

// Export app for tests
module.exports = { app, server, startApp, gracefulShutdown };
