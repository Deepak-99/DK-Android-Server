const { Op } = require("sequelize");
const { Command, Device } = require("../models");
const logger = require("../utils/logger");

class WebSocketService {
    /**
     * @param {SocketIO.Server} io
     */
    constructor(io) {
        console.log("\n=== 🔄 [WebSocketService] Constructor called ===");
        console.log("📡 Initializing WebSocket service...");

        if (!io) {
            throw new Error("Socket.IO instance is required");
        }

        this.io = io;

        // Keep devices separated from admin sockets
        this.deviceSockets = new Map(); // deviceId -> socket
        this.connectionCount = 0;

        // Register event handlers
        this.setupEventHandlers();

        console.log("✅ [WebSocketService] Initialization completed\n");
    }

    /**
     * Setup socket event handlers
     */
    setupEventHandlers() {
        console.log("\n=== 🔌 Setting up Socket.IO handlers ===");

        this.io.on("connection", (socket) => {
            this.connectionCount++;
            console.log(`\n🔌 New socket connected → ${socket.id}`);

            this.setupAdminEvents(socket);
            this.setupDeviceEvents(socket);

            socket.on("disconnect", (reason) => {
                this.handleDisconnect(socket, reason);
            });

            socket.on("error", (err) => {
                console.error("❌ WebSocket Error:", err);
            });
        });

        console.log("✅ WebSocket handlers active");
    }

    /**
     * Admin panel events
     */
    setupAdminEvents(socket) {
        socket.on("admin-connect", () => {
            console.log("👨‍💼 Admin connected:", socket.id);

            socket.join("admin");

            this.io.to(socket.id).emit("server-event", {
                type: "admin_status",
                payload: {
                    connected: true,
                    deviceCount: this.deviceSockets.size,
                    timestamp: new Date().toISOString(),
                },
            });
        });
    }

    /**
     * Device-related events
     */
    setupDeviceEvents(socket) {
        /**
         * Device registers itself
         */
        socket.on("register", async ({ deviceId }) => {
            if (!deviceId) return;

            console.log(`📱 Device registered → ${deviceId}`);

            this.deviceSockets.set(deviceId, socket);

            await this.updateDeviceStatus(deviceId, true);

            this.broadcastAdmin({
                type: "device_connected",
                payload: { deviceId, timestamp: new Date().toISOString() },
            });
        });

        /**
         * Device sends command-response
         */
        socket.on("command-response", async (response) => {
            console.log("🔽 Command response received:", response);

            if (!response.commandId) return;

            await Command.update(
                {
                    status: response.success ? "completed" : "failed",
                    response: response.response || null,
                    completedAt: new Date(),
                },
                { where: { id: response.commandId }, silent: true }
            );

            this.broadcastAdmin({
                type: "command_response",
                payload: {
                    ...response,
                    timestamp: new Date().toISOString(),
                },
            });
        });
    }

    /**
     * Handle disconnections
     */
    async handleDisconnect(socket, reason) {
        let disconnectedDevice = null;

        for (const [deviceId, s] of this.deviceSockets) {
            if (s.id === socket.id) {
                disconnectedDevice = deviceId;
                this.deviceSockets.delete(deviceId);

                console.log(`❌ Device disconnected → ${deviceId} (${socket.id})`);

                await this.updateDeviceStatus(deviceId, false);

                this.broadcastAdmin({
                    type: "device_disconnected",
                    payload: {
                        deviceId,
                        reason,
                        timestamp: new Date().toISOString(),
                    },
                });
            }
        }

        if (!disconnectedDevice) {
            console.log(`ℹ Client disconnected (not a device):`, socket.id);
        }
    }

    /**
     * Update online/offline state in DB
     */
    async updateDeviceStatus(deviceId, isOnline) {
        try {
            await Device.update(
                {
                    isOnline,
                    lastSeen: new Date(),
                },
                { where: { deviceId }, silent: true }
            );

            console.log(
                `📌 Device ${deviceId} set → ${isOnline ? "ONLINE" : "OFFLINE"}`
            );
        } catch (err) {
            console.error("❌ Failed to update device status:", err);
        }
    }

    /**
     * Send event to ALL admin clients
     */
    broadcastAdmin(eventObject) {
        this.io.to("admin").emit("server-event", eventObject);
    }

    /**
     * Send a command to a connected device
     */
    async sendCommand(deviceId, command) {
        const socket = this.deviceSockets.get(deviceId);

        if (!socket) {
            return {
                success: false,
                error: `Device ${deviceId} is not connected`,
                timestamp: new Date().toISOString(),
            };
        }

        const commandId = `cmd_${Date.now()}_${Math.random()
            .toString(36)
            .substr(2, 6)}`;

        const timeout = command.timeout || 30000;

        // Save command to DB
        await Command.create({
            id: commandId,
            deviceId,
            commandType: command.type,
            commandData: command.data || {},
            status: "pending",
            sentAt: new Date(),
            timeoutAt: new Date(Date.now() + timeout),
        });

        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                socket.removeListener("command-response", onResponse);
                reject(new Error(`Command timeout (${timeout} ms)`));
            }, timeout);

            const onResponse = (response) => {
                if (response.commandId === commandId) {
                    clearTimeout(timer);
                    socket.removeListener("command-response", onResponse);

                    resolve({
                        success: true,
                        commandId,
                        response,
                    });
                }
            };

            socket.on("command-response", onResponse);

            socket.emit("command", {
                commandId,
                type: command.type,
                data: command.data || {},
                timestamp: new Date().toISOString(),
            });

            console.log(`📤 Sent command to device → ${deviceId}`, {
                commandId,
                type: command.type,
            });
        });
    }
}

module.exports = WebSocketService;
