'use strict';

const WebSocket = require("ws");

/*
==================================================
 STREAM SESSION STORE
==================================================
deviceId ->
{
   producer : device socket
   viewers  : Set<admin sockets>
}
==================================================
*/

const sessions = new Map();

function createStreamGateway() {

    const wss = new WebSocket.Server({
        noServer: true,
        maxPayload: 20 * 1024 * 1024
    });

    wss.on("connection", (ws, req) => {

        const user = ws.user;

        if (!user) {
            ws.close();
            return;
        }

        const role = user.role;
        const deviceId = user.deviceId;

        /* =====================================================
           DEVICE CONNECTING (FRAME PRODUCER)
        ===================================================== */

        if (role === "device") {

            console.log("📱 Stream producer:", deviceId);

            let session = sessions.get(deviceId);

            if (!session) {
                session = {
                    producer: null,
                    viewers: new Set()
                };
                sessions.set(deviceId, session);
            }

            /* replace old producer */
            if (session.producer) {
                try {
                    session.producer.close();
                } catch {}
            }

            session.producer = ws;

            ws.on("message", buffer => {

                // binary frame broadcast
                for (const viewer of session.viewers) {

                    if (
                        viewer.readyState === WebSocket.OPEN
                    ) {
                        viewer.send(buffer, {
                            binary: true
                        });
                    }
                }
            });

            ws.on("close", () => {

                console.log(
                    "❌ Producer disconnected:",
                    deviceId
                );

                for (const v of session.viewers)
                    v.close();

                sessions.delete(deviceId);
            });

            return;
        }

        /* =====================================================
           ADMIN CONNECTING (VIEWER)
        ===================================================== */

        if (role === "admin") {

            const url =
                new URL(req.url, "http://localhost");

            const targetDevice =
                url.searchParams.get("deviceId");

            if (!targetDevice) {
                ws.close();
                return;
            }

            console.log(
                "🖥 Admin viewer →",
                targetDevice
            );

            let session =
                sessions.get(targetDevice);

            if (!session) {
                session = {
                    producer: null,
                    viewers: new Set()
                };

                sessions.set(
                    targetDevice,
                    session
                );
            }

            session.viewers.add(ws);

            ws.on("close", () => {

                session.viewers.delete(ws);

                console.log(
                    "🖥 Viewer disconnected:",
                    targetDevice
                );

                if (
                    session.viewers.size === 0 &&
                    !session.producer
                ) {
                    sessions.delete(targetDevice);
                    console.log(
                        "🧹 Session cleaned:",
                        targetDevice
                    );
                }
            });


            return;
        }

        ws.close();
    });

    /* =====================================================
       ADMIN HELPER API
    ===================================================== */

    wss.hasSession = deviceId =>
        sessions.has(deviceId);

    return wss;
}

module.exports = createStreamGateway;
