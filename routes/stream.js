const express = require("express");
const router = express.Router();
const eventBus = require("../eventBus");

// SSE STREAM FOR LIVE LOCATION UPDATES
router.get("/devices/:deviceId/locations/stream", (req, res) => {
    const { deviceId } = req.params;

    // Headers required for SSE
    res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no"
    });

    res.write("\n");

    const channel = `location:${deviceId}`;

    const sendEvent = (loc) => {
        res.write(`data: ${JSON.stringify(loc)}\n\n`);
    };

    // Listen for events
    eventBus.on(channel, sendEvent);

    // Cleanup on disconnect
    req.on("close", () => {
        eventBus.removeListener(channel, sendEvent);
        res.end();
    });
});

module.exports = router;
