import api from './api';

interface GetDevicesParams {
    page?: number;
    limit?: number;
    search?: string;
    status?: 'online' | 'offline';
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface Device {
    id: string;
    name: string;
    model: string;
    osVersion: string;
    status: 'online' | 'offline';
    lastSeen: string;
    // Add other device properties as needed
}

interface DevicesResponse {
    items: Device[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export const getDevices = async (params: GetDevicesParams = {}): Promise<DevicesResponse> => {
    const { data } = await api.get<DevicesResponse>('/devices', { params });
    return data;
};

export const getDeviceById = async (id: string): Promise<Device> => {
    const { data } = await api.get<Device>(`/devices/${id}`);
    return data;
};

// Add other device-related API calls as needed