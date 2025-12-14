// routes/stream.js
const express = require('express');
const router = express.Router();
const eventBus = require('../eventBus');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

/**
 * SSE stream for live location updates for a single device
 * URL: /api/devices/:deviceId/locations/stream?token=JWT
 */
router.get(
  '/devices/:deviceId/locations/stream',
  authenticateToken,
  requireAdmin,
  (req, res) => {
    const { deviceId } = req.params;

    // Required SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no', // disable buffering on nginx
    });

    // Initial padding (helps with some proxies)
    res.write('\n');

    const channel = `location:${deviceId}`;

    const sendEvent = (loc) => {
      // Single consistent event format
      const payload = {
        deviceId,
        ...loc,
      };

      res.write(`event: location\n`);
      res.write(`data: ${JSON.stringify(payload)}\n\n`);
    };

    // Subscribe to EventBus
    eventBus.on(channel, sendEvent);

    // Heartbeat to keep connections alive
    const heartbeatInterval = setInterval(() => {
      res.write(`event: heartbeat\n`);
      res.write(`data: ${JSON.stringify({ ts: Date.now() })}\n\n`);
    }, 15000);

    const cleanup = () => {
      eventBus.removeListener(channel, sendEvent);
      clearInterval(heartbeatInterval);
      try {
        res.end();
      } catch (_) {
        // ignore
      }
    };

    // Client closed connection
      res.on('close', cleanup);
      res.on('finish', cleanup);
      req.on('aborted', cleanup);
  }
);

module.exports = router;
