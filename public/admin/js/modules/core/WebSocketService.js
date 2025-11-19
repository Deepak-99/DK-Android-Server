// public/admin/js/modules/core/WebSocketService.js
import { io } from "https://cdn.socket.io/4.7.5/socket.io.esm.min.js";

export class WebSocketService {
    constructor(onMessage = null) {
        this.socket = null;
        this.onMessage = typeof onMessage === "function" ? onMessage : null;
        this.isConnected = false;

        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 10;
        this.reconnectDelay = 1000;

        this.eventListeners = {};
    }

    connect() {
        const token = localStorage.getItem("hawkshaw_token");

        this.socket = io("/", {
            path: "/socket.io",
            transports: ["websocket"],
            auth: { token }
        });

        /** ───── Connection Events ───── */
        this.socket.on("connect", () => {
            console.log("🔌 Admin WebSocket connected", this.socket.id);
            this.isConnected = true;
            this.reconnectAttempts = 0;
            this.emitLocal("connect");

            // Join admin room
            this.socket.emit("admin-connect");
        });

        this.socket.on("disconnect", (reason) => {
            console.warn("⚠️ WebSocket disconnected:", reason);
            this.isConnected = false;
            this.emitLocal("disconnect");
        });

        this.socket.on("connect_error", (err) => {
            console.error("❌ WS connect error:", err.message);

            this.reconnectAttempts++;
            if (this.reconnectAttempts < this.maxReconnectAttempts) {
                setTimeout(() => this.connect(), this.reconnectDelay);
                this.reconnectDelay = Math.min(this.reconnectDelay * 2, 10000);
            }
        });

        /** ───── Backend Events ───── */
        this.socket.on("device-registered", (data) => {
            console.log("📱 Device Registered:", data);
            this.emitLocal("device-registered", data);
        });

        this.socket.on("device-status", (data) => {
            console.log("📶 Device status update:", data);
            this.emitLocal("device-status", data);
        });

        this.socket.on("command-response", (data) => {
            console.log("📥 Command response:", data);
            this.emitLocal("command-response", data);
        });

        this.socket.on("device-heartbeat", (data) => {
            console.log("💓 Heartbeat:", data);
            this.emitLocal("device-heartbeat", data);
        });
    }

    /** Send custom events */
    send(event, payload) {
        if (!this.socket || !this.isConnected) return;
        this.socket.emit(event, payload);
    }

    /** Add frontend event listeners */
    on(event, callback) {
        if (!this.eventListeners[event]) this.eventListeners[event] = [];
        this.eventListeners[event].push(callback);
    }

    emitLocal(event, payload) {
        if (!this.eventListeners[event]) return;
        this.eventListeners[event].forEach(cb => cb(payload));
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }
}
