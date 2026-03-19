'use strict';

const createCommandGateway = require("./commandGateway");
const createStreamGateway = require("./streamGateway");
const createWebRTCGateway = require("./webrtcGateway");
const { verifyWS } = require("./wsAuth");

function initDualWS(server) {

    const commandWS = createCommandGateway();
    const streamWS = createStreamGateway();
    const webrtcWS = createWebRTCGateway();

    server.on("upgrade", (req, socket, head) => {

        try {

            /* =====================================================
               ✅ STEP 1 — JWT VERIFY
            ===================================================== */

            const user = verifyWS(req);

            if (!user) {

                socket.write(
                    "HTTP/1.1 401 Unauthorized\r\n\r\n"
                );

                socket.destroy();
                return;
            }

            // attach identity
            req.wsUser = user;

            const { url } = req;

            /* =====================================================
               ✅ COMMAND CHANNEL
            ===================================================== */

            if (url.startsWith("/ws/command")) {

                commandWS.handleUpgrade(
                    req,
                    socket,
                    head,
                    ws => {

                        ws.user = user;

                        commandWS.emit(
                            "connection",
                            ws,
                            req
                        );
                    }
                );

                return;
            }

            /* =====================================================
               ✅ STREAM CHANNEL
            ===================================================== */

            if (url.startsWith("/ws/stream")) {

                streamWS.handleUpgrade(
                    req,
                    socket,
                    head,
                    ws => {

                        ws.user = user;

                        streamWS.emit(
                            "connection",
                            ws,
                            req
                        );
                    }
                );

                return;
            }

            /* WEBRTC SIGNALING */

            if (url.startsWith("/ws/webrtc")) {

                webrtcWS.handleUpgrade(
                    req,
                    socket,
                    head,
                    ws => {

                        ws.user = user;

                        webrtcWS.emit(
                            "connection",
                            ws,
                            req
                        );
                    }
                );

                return;
            }

            socket.destroy();

        } catch (err) {

            console.error(
                "WS Upgrade Error:",
                err
            );

            socket.destroy();
        }
    });

    console.log(
        "✅ Command + Stream + WebRTC WS initialized"
    );
}

module.exports = { initDualWS };