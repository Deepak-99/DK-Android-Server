import api from "./http";

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
    data: {
        devices: Device[];
        page: number;
        limit: number;
        total: number;
    };
}

export const devicesApi = {
    async list(page = 1, limit = 20): Promise<DeviceListResponse> {
        return api.get(`/devices?page=${page}&limit=${limit}`);
    },

    async get(id: number) {
        return api.get(`/devices/${id}`);
    }
};
