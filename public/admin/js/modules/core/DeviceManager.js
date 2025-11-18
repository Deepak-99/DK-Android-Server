// public/admin/js/modules/core/DeviceManager.js
import { handleError } from '../utils/errorHandler.js';

export class DeviceManager {
    constructor(apiService) {
        this.api = apiService;
        this.devices = [];
        this.currentDevice = null;

        // Optional UI injection from AdminPanel
        this.ui = null;
    }

    /**
     * Load all devices from the server
     * @returns {Promise<Array>}
     */
    async loadDevices() {
        try {
            const response = await this.api.get('/devices');

            if (!response) {
                throw new Error('Invalid API response');
            }
            if (response.success === false) {
                throw new Error(response.error || 'Failed to load devices');
            }

            // Extract devices safely from multiple backend formats
            let devices =
                response.data?.devices ||     // { success, data: { devices } }
                response.data ||              // { success, data: [ ... ] }
                response.devices ||           // { success, devices: [ ... ] }
                (Array.isArray(response) ? response : []) ||
                [];

            if (!Array.isArray(devices)) {
                console.warn('Devices were not an array. Received:', devices);
                devices = [];
            }

            // Normalize all device objects
            this.devices = devices.map(d => this.normalizeDevice(d));

            return this.devices;
        } catch (error) {
            console.error('Device load error:', error);

            if (this.ui) {
                this.ui.showNotification('Failed to load devices', 'error');
            }

            throw error;
        }
    }

    /**
     * Get a single device by ID
     */
    async getDeviceById(deviceId) {
        try {
            const response = await this.api.get(`/devices/${deviceId}`);

            if (!response) throw new Error('Invalid API response');
            if (response.success === false)
                throw new Error(response.error || `Failed to load device ${deviceId}`);

            const rawDevice =
                response.data?.device ||  // { success, data: { device } }
                response.data ||          // { success, data: ... }
                response.device ||        // { success, device }
                response;

            this.currentDevice = this.normalizeDevice(rawDevice);

            return this.currentDevice;
        } catch (error) {
            console.error(`Failed to load device ${deviceId}:`, error);

            if (this.ui) {
                this.ui.showNotification(`Failed to load device: ${error.message}`, 'error');
            }

            throw error;
        }
    }

    /**
     * Send a command to a device
     */
    async sendCommand(deviceId, command, params = {}) {
        try {
            const response = await this.api.post(`/devices/${deviceId}/command`, {
                command,
                ...params
            });

            if (!response || response.success === false) {
                throw new Error(response?.error || `Command '${command}' failed`);
            }

            this.ui?.showNotification(`Command '${command}' sent successfully`, 'success');

            return response.data || response;
        } catch (error) {
            console.error(`Failed to send command to device ${deviceId}:`, error);

            this.ui?.showNotification(`Command failed: ${error.message}`, 'error');

            throw error;
        }
    }

    /**
     * Normalize all device fields (support snake_case + camelCase)
     */
    normalizeDevice(d) {
        if (!d || typeof d !== 'object') return {};

        const deviceId = d.deviceId || d.device_id;
        const name =
            d.nickname ||
            d.name ||
            d.device_name ||
            d.deviceName ||
            'Unnamed Device';

        const lastSeen = d.lastSeen || d.last_seen || null;

        return {
            ...d,
            deviceId,
            name,
            lastSeen,
            status: this.normalizeStatus(d.status, lastSeen)
        };
    }

    /**
     * Normalize online/offline status
     */
    normalizeStatus(status, lastSeen) {
        if (status === 'online' || status === 'offline') return status;

        if (lastSeen) {
            const last = new Date(lastSeen).getTime();
            const threshold = Date.now() - 5 * 60 * 1000; // 5 mins
            return last > threshold ? 'online' : 'offline';
        }

        return 'offline';
    }
}
