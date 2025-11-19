// DeviceManager.js
import { handleError } from '../utils/errorHandler.js';

export class DeviceManager {
    constructor(apiService, ui) {
        this.api = apiService;
        this.devices = [];
        this.currentDevice = null;
        this.ui = ui;
    }

    async loadDevices() {
        try {
            const response = await this.api.get('/devices');
            // Accept formats:
            // 1) { success: true, data: { devices: [], pagination: {} } }
            // 2) { devices: [] }
            // 3) raw array []
            let devices = [];
            if (!response) throw new Error('No response from API');
            if (Array.isArray(response)) devices = response;
            else if (response.data && Array.isArray(response.data.devices)) devices = response.data.devices;
            else if (response.devices && Array.isArray(response.devices)) devices = response.devices;
            else if (response.data && Array.isArray(response.data)) devices = response.data;
            else devices = [];

            this.devices = devices.map(d => ({
                ...d,
                status: this.normalizeStatus(d.status, d.lastSeen)
            }));
            return this.devices;
        } catch (err) {
            console.error('Device load error:', err);
            if (this.ui && this.ui.showNotification) this.ui.showNotification('Failed to load devices', 'error');
            throw err;
        }
    }

    async getDeviceById(deviceId) {
        try {
            const response = await this.api.get(`/devices/${deviceId}`);
            if (!response) throw new Error('No response from API');

            const device = response.data && response.data.device ? response.data.device : (response.device || response);
            this.currentDevice = { ...device, status: this.normalizeStatus(device.status, device.lastSeen) };
            return this.currentDevice;
        } catch (err) {
            console.error(`Failed to load device ${deviceId}:`, err);
            if (this.ui && this.ui.showNotification) this.ui.showNotification(`Failed to load device: ${err.message}`, 'error');
            throw err;
        }
    }

    async sendCommand(deviceId, command, params = {}) {
        try {
            const response = await this.api.post(`/devices/${deviceId}/command`, { command, ...params });
            if (!response) throw new Error(response?.error || 'Command failed');
            if (this.ui && this.ui.showNotification) this.ui.showNotification(`Command '${command}' sent`, 'success');
            return response;
        } catch (err) {
            console.error(`Failed to send command to device ${deviceId}:`, err);
            if (this.ui && this.ui.showNotification) this.ui.showNotification(`Command failed: ${err.message}`, 'error');
            throw err;
        }
    }

    normalizeStatus(status, lastSeen) {
        if (status === 'online' || status === 'offline') return status;
        if (lastSeen) {
            const last = new Date(lastSeen).getTime();
            const fiveMin = Date.now() - (5 * 60 * 1000);
            return last > fiveMin ? 'online' : 'offline';
        }
        return 'offline';
    }
}
