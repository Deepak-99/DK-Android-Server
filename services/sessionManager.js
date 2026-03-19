class SessionManager {
    constructor() {
        this.devices = new Map();
        this.admins = new Map();
    }

    registerDevice(deviceId, socket) {
        this.devices.set(deviceId, socket);
        console.log("✅ Device connected:", deviceId);
    }

    removeDevice(deviceId) {
        this.devices.delete(deviceId);
        console.log("❌ Device disconnected:", deviceId);
    }

    getDevice(deviceId) {
        return this.devices.get(deviceId);
    }

    registerAdmin(adminId, socket) {
        this.admins.set(adminId, socket);
    }

    removeAdmin(adminId) {
        this.admins.delete(adminId);
    }
}

module.exports = new SessionManager();
