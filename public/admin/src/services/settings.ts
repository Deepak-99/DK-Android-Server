// src/services/settings.ts
import api from './api';

export interface DeviceSettings {
    autoUpdate: boolean;
    backupEnabled: boolean;
    powerSaving: boolean;
    notifications: boolean;
}

export const getDeviceSettings = async (
    deviceId: string
): Promise<DeviceSettings> => {
    const res = await api.get(`/devices/${deviceId}/settings`);
    return res.data;
};

export const updateDeviceSettings = async (
    deviceId: string,
    settings: DeviceSettings
): Promise<void> => {
    await api.put(`/devices/${deviceId}/settings`, settings);
};
