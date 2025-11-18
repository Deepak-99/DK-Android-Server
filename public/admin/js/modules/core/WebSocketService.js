// public/admin/js/modules/core/WebSocketService.js
// Robust WebSocket client for Admin Panel

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

    /** Connect to server WebSocket endpoint */
    connect() {
        const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsURL = `${protocol}//${location.host}/ws`;

        try {
            this.socket = new WebSocket(wsURL);

            this.socket.onopen = () => {
                console.log('%c[WS] Connected', 'color:green');
                this.connected = true;
                this.reconnectAttempts = 0;

                // Join admin room
                this.send({ type: 'admin-connect' });

                if (this.onConnect) this.onConnect();

                // Flush queued messages
                while (this.queue.length > 0) {
                    this.socket.send(JSON.stringify(this.queue.shift()));
                }
            };

            this.socket.onmessage = (event) => this._handleMessage(event);
            this.socket.onerror = (err) => this._handleError(err);

            this.socket.onclose = () => {
                console.warn('%c[WS] Disconnected', 'color:red');

                this.connected = false;
                if (this.onDisconnect) this.onDisconnect();

                this._tryReconnect();
            };

        } catch (err) {
            console.error('[WS] Fatal connect error:', err);
            this._tryReconnect();
        }
    }

    /** Attempt reconnect with exponential backoff */
    _tryReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('[WS] Max reconnection attempts reached.');
            return;
        }

        this.reconnectAttempts++;
        const delay = this.reconnectDelay * Math.min(this.reconnectAttempts, 10);

        console.log(`[WS] Reconnecting in ${delay}ms...`);

        setTimeout(() => this.connect(), delay);
    }

    /** Send message or queue if offline */
    send(payload) {
        if (!payload) return;

        try {
            const msg = JSON.stringify(payload);

            if (this.connected && this.socket?.readyState === WebSocket.OPEN) {
                this.socket.send(msg);
            } else {
                this.queue.push(payload);
            }
        } catch (err) {
            console.error('[WS] Send error:', err);
        }
    }

    /** Register listener: ws.on('event', fn) */
    on(event, callback) {
        if (!this.eventListeners[event]) {
            this.eventListeners[event] = [];
        }
        this.eventListeners[event].push(callback);
    }

    /** Emit event locally to listeners */
    _emit(event, data) {
        if (this.eventListeners[event]) {
            for (const cb of this.eventListeners[event]) cb(data);
        }

        if (this.onEvent) {
            this.onEvent(event, data);
        }
    }

    /** Parse messages from backend Socket.IO → WS bridge */
    _handleMessage(event) {
        try {
            const msg = JSON.parse(event.data);

            // Standard format:
            //   { type: "device_update", payload: {...} }

            if (!msg.type) {
                console.warn('[WS] Unknown message', msg);
                return;
            }

            this._emit(msg.type, msg.payload);

        } catch (err) {
            console.error('[WS] Bad message:', event.data, err);
        }
    }

    _handleError(err) {
        console.error('[WS] Error:', err);
    }

    disconnect() {
        try {
            this.connected = false;
            if (this.socket) this.socket.close();
        } catch (_) {}
    }
}
