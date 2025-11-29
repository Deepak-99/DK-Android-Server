import io from "https://cdn.socket.io/4.7.4/socket.io.esm.min.js";

export class WebSocketService {
    constructor({ onEvent = null, onConnect = null, onDisconnect = null } = {}) {
        this.socket = null;
        this.onEvent = onEvent;
        this.onConnect = onConnect;
        this.onDisconnect = onDisconnect;

        this.connected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 20;
        this.reconnectDelay = 1000; // exponential backoff start
        this.eventListeners = {};
        this.queue = [];
    }

    /** Connect using Socket.IO */
    connect() {
        try {
            this.socket = io("/", {
                transports: ["websocket"],        // direct WebSocket only
                path: "/socket.io",               // default Socket.IO path
                reconnection: true,
                reconnectionAttempts: this.maxReconnectAttempts,
                reconnectionDelay: this.reconnectDelay
            });

            /** On successful connect */
            this.socket.on("connect", () => {
                console.log("%c[WS] Connected (Socket.IO)", "color:green");

                this.connected = true;
                this.reconnectAttempts = 0;

                // Identify admin panel to backend
                this.socket.emit("admin-connect");

                if (this.onConnect) this.onConnect();

                // Flush pending messages
                while (this.queue.length > 0) {
                    this.socket.emit("admin-event", this.queue.shift());
                }
            });

            /** On disconnect */
            this.socket.on("disconnect", (reason) => {
                console.warn("[WS] Disconnected:", reason);
                this.connected = false;

                if (this.onDisconnect) this.onDisconnect();
            });

            /** Socket.IO connection errors */
            this.socket.on("connect_error", (err) => {
                console.error("[WS] Connection error:", err);
            });

            /** Server → Admin messages */
            this.socket.on("server-event", (data) => {
                this._handleMessage({ data: JSON.stringify(data) });
            });

        } catch (err) {
            console.error("[WS] Fatal connect error:", err);
        }
    }

    /** Attempt reconnect with exponential backoff */
    _tryReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error("[WS] Max reconnection attempts reached.");
            return;
        }

        this.reconnectAttempts++;
        const delay = this.reconnectDelay * Math.min(this.reconnectAttempts, 10);

        console.log(`[WS] Reconnecting in ${delay}ms...`);
        setTimeout(() => this.connect(), delay);
    }

    /** Send message through Socket.IO (or queue if offline) */
    send(payload) {
        if (!payload) return;

        try {
            if (this.connected) {
                this.socket.emit("admin-event", payload);
            } else {
                this.queue.push(payload);
            }
        } catch (err) {
            console.error("[WS] Send error:", err);
        }
    }

    /** Register event listener */
    on(event, callback) {
        if (!this.eventListeners[event]) {
            this.eventListeners[event] = [];
        }
        this.eventListeners[event].push(callback);
    }

    /** Emit event locally */
    _emit(event, data) {
        if (this.eventListeners[event]) {
            for (const cb of this.eventListeners[event]) cb(data);
        }

        if (this.onEvent) {
            this.onEvent(event, data);
        }
    }

    /** Handle incoming messages */
    _handleMessage(event) {
        try {
            const msg = JSON.parse(event.data);

            // Expected format:
            //   { type: "device_update", payload: {...} }
            if (!msg.type) {
                console.warn("[WS] Unknown message:", msg);
                return;
            }

            this._emit(msg.type, msg.payload);

        } catch (err) {
            console.error("[WS] Bad message:", event.data, err);
        }
    }

    disconnect() {
        try {
            this.connected = false;
            if (this.socket) this.socket.disconnect();
        } catch (_) {}
    }
}
