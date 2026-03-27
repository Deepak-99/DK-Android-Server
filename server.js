'use strict';

console.log("[BOOT] STEP 1: Server starting");

require('dotenv').config();

console.log("[BOOT] STEP 2: ENV loaded");

const http = require('http');

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');

const { Server } = require('socket.io');

console.log("[BOOT] STEP 3: Core modules loaded");

const logger = require('./utils/logger');

console.log("[BOOT] STEP 4: Logger loaded");

const { testConnection } = require('./config/database');

console.log("[BOOT] STEP 5: Database module loaded");

console.log("[BOOT] STEP 6: Loading models...");

// 🔥 DIRECT IMPORT (NO FUNCTION CALL)
const db = require('./models');

console.log("[BOOT] STEP 7: Models initialized");

/*
  Expose models globally so routes/services
  do NOT import models/index again
*/
global.db = db;

console.log("[BOOT] STEP 8: Models initialized and registered globally");

/* =========================
   LOAD SERVICES (SAFE)
========================= */

console.log("[DEBUG] Loading WebSocketService...");
const WebSocketService = require('./services/WebSocketService');
console.log("[DEBUG] WebSocketService Loaded");

console.log("[DEBUG] Loading fileCleanup...");
const fileCleanupService = require('./services/fileCleanup');
console.log("[DEBUG] FileCleanup Loaded");

console.log("[DEBUG] Loading syncHelpers...");
const { ensureIsActiveColumn } = require('./utils/syncHelpers');
console.log("[DEBUG] SyncHelpers Loaded");

console.log("[BOOT] STEP 9: Services loaded");

/* =========================
   LOAD ROUTES
========================= */

console.log("[BOOT] STEP 10: Loading routes...");
console.log("Loading auth route");
const authRouter = require('./routes/auth');

console.log("Loading devices route");
const devicesRouter = require('./routes/devices');

console.log("Loading dashboard route");
const dashboardRouter = require('./routes/dashboard');

console.log("Loading rbac route");
const rbacRouter = require('./routes/rbac');

console.log("[BOOT] STEP 11: Routes loaded");

const healthRouter = require('./routes/health');

/* =========================
   EXPRESS SETUP
========================= */

const app = express();
const server = http.createServer(app);

console.log("[BOOT] STEP 12: Express created");

/* =========================
   MIDDLEWARES
========================= */

app.use(helmet());
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});

app.use(limiter);

/* ✅ REQUEST LOGGER */
app.use((req, res, next) => {
  const start = Date.now();

  const { method, originalUrl } = req;
  const ip = req.ip || req.connection.remoteAddress;

  res.on('finish', () => {
    const duration = Date.now() - start;

    logger.info(
      `[REQ] ${method} ${originalUrl} | ${res.statusCode} | ${duration}ms | IP: ${ip}`
    );
  });

  next();
});

/* =========================
   SOCKET.IO
========================= */

const io = new Server(server, {
  cors: { origin: "*" }
});

const webSocketService = new WebSocketService(io);

// If you implemented init()
if (typeof webSocketService.init === 'function') {
  webSocketService.init();
}

app.set('io', io);
app.set('webSocketService', webSocketService);

console.log("[BOOT] STEP 13: WebSocket initialized");

/* =========================
   ROUTES REGISTRATION
========================= */

app.use('/api/auth', authRouter);
app.use('/api/devices', devicesRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/rbac', rbacRouter);
app.use('/api/health', healthRouter);

/* ✅ TEST ROUTE (IMPORTANT FOR BROWSER) */
app.get('/', (req, res) => {
  res.send('🚀 Hawkshaw Server is Running');
});

console.log("[BOOT] STEP 14: Routes registered");

/* =========================
   DATABASE CONNECTION
========================= */

const PORT = process.env.PORT || 3000;

async function connectToDatabase() {

  console.log("[BOOT] STEP 15: connectToDatabase()");

  await testConnection();

  console.log("[BOOT] STEP 16: DB connection successful");
}

/* =========================
   START SERVER
========================= */

async function startServer() {

  try {
    console.log("[BOOT] STEP 17: startServer()");

    await connectToDatabase();

    // ✅ Ensure DB structure AFTER connection
    await ensureIsActiveColumn();

    // ✅ Start background services
    if (typeof fileCleanupService.start === 'function') {
      fileCleanupService.start();
      console.log("[BOOT] FileCleanup service started");
    }

    console.log("[BOOT] STEP 18: Starting HTTP server");

    server.listen(PORT, () => {
      console.log(`[BOOT] STEP 19: Server running on port ${PORT}`);
    });

  } catch (error) {

    logger.error("[FATAL] Server startup failed", {
      message: error.message,
      stack: error.stack
    });

    process.exit(1);
  }
}

startServer();

module.exports = { app, server };