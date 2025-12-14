// services/wsClient.js
// Bridge adapter between deviceFileAgent and WebSocketService

const app = require("../server").app;

function getService() {
    const svc = app.get("webSocketService");
    if (!svc) {
        throw new Error("WebSocketService not initialized yet");
    }
    return svc;
}

module.exports = {
    async sendAndWait(deviceId, payload) {
        const wsService = getService();

        if (typeof wsService.sendCommandAndWait !== "function") {
            throw new Error("WebSocketService.sendCommandAndWait not implemented");
        }

        return wsService.sendCommandAndWait(deviceId, payload);
    }
};
