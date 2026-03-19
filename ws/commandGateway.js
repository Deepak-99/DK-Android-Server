'use strict';

const WebSocket = require("ws");

/*
   Connected device command channels
   deviceId -> websocket
*/
const devices = new Map();

function createCommandGateway() {

    const wss = new WebSocket.Server({
        noServer: true
    });

    wss.on("connection", (ws, req) => {

        /* ============================================
           ✅ AUTH ALREADY VERIFIED
        ============================================ */

        const user = ws.user;

        if (!user || !user.deviceId) {
            console.warn("❌ Invalid command WS user");
            ws.close();
            return;
        }

        const deviceId = user.deviceId;

        ws.deviceId = deviceId;

        /* ============================================
           ✅ SINGLE ACTIVE CONNECTION PER DEVICE
        ============================================ */

        if (devices.has(deviceId)) {

            console.log("♻️ Replacing old socket:", deviceId);

            try {
                devices.get(deviceId)?.close();
            } catch {}
        }

        devices.set(deviceId, ws);

        console.log("✅ Command WS connected:", deviceId);


        /* ============================================
           Keyboard Injection
        ============================================ */
        if (data.type === "keyboard") {

            const device =
                devices.get(data.payload.deviceId)

            if (device) {

                device.send(JSON.stringify({
                    type: "keyboard",
                    payload: data.payload
                }))
            }
        }


        /* ============================================
           MESSAGE HANDLING
        ============================================ */

        ws.on("message", msg => {

            try {

                const data = JSON.parse(msg.toString());

                console.log(`📩 Device message ${deviceId}:`, data.type);

                // later routed to command bus
            } catch {

                console.warn("Invalid device command");
            }
        });

        /* ============================================
           CLEANUP
        ============================================ */

        ws.on("close", () => {

            console.log("❌ Command WS closed:", deviceId);

            devices.delete(deviceId);
        });
    });

    /* ===============================
       ADMIN → DEVICE COMMAND ROUTER
    =============================== */

    wss.sendToDevice = function(deviceId, payload) {

        const ws = devices.get(deviceId)

        if (!ws || ws.readyState !== WebSocket.OPEN)
            return false

        ws.send(JSON.stringify(payload))
        return true
    }

    return wss
}

module.exports = createCommandGateway
