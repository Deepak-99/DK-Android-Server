import api from './api';

export interface Device {
    id: number;
    deviceId: string;
    name: string;
    nickname?: string;
    model: string;
    manufacturer: string;
    android_version: string;
    app_version: string;
    lastSeen: string;
    status: string;
}

export interface DeviceListResponse {
    success: boolean;
    data: Device[];
    pagination: {
        total: number;
        page: number;
        totalPages: number;
    };
}

export const devicesApi = {
    async list(page = 1, limit = 20): Promise<DeviceListResponse> {
        const res = await api.get(`/devices?page=${page}&limit=${limit}`);
        return res.data;
    },

    async get(id: number) {
        const res = await api.get(`/devices/${id}`);
        return res.data;
    }
};