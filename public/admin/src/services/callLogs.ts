import api from './api';

export interface CallLog {
    id: string;
    phoneNumber: string;
    contactName?: string;
    type: 'incoming' | 'outgoing' | 'missed' | 'rejected' | 'blocked';
    date: string;
    duration: number; // in seconds
    isRead: boolean;
    simSlot?: number;
    photoUri?: string;
    cachedNumberType?: number;
    cachedNumberLabel?: string;
    countryIso?: string;
    geocodedLocation?: string;
    transcription?: string;
    features?: number;
    viaNumber?: string;
}

export interface CallLogsFilter {
    page?: number;
    limit?: number;
    search?: string;
    type?: string;
    startDate?: string;
    endDate?: string;
    sortBy?: 'date' | 'duration' | 'phoneNumber';
    sortOrder?: 'ASC' | 'DESC';
}


export interface CallLogsStats {
    total: number;
    incoming: number;
    outgoing: number;
    missed: number;
    rejected: number;
    blocked: number;
    totalDuration: number;
    averageDuration: number;
    byDate: Array<{ date: string; count: number }>;
    byHour: Array<{ hour: number; count: number }>;
    byContact: Array<{ name: string; number: string; count: number }>;
}

export interface CallLogsResponse {
    data: CallLog[];
    pagination: {
        total: number;
        page: number;
        totalPages: number;
    };
}


export const getCallLogs = async (
    deviceId: string,
    filter?: CallLogsFilter
): Promise<CallLogsResponse> => {

    const response = await api.get(
        `/devices/${deviceId}/logs`,
        { params: filter }
    );

    return response.data;
};


export const getCallLogStats = async (
    deviceId: string,
    filter?: Omit<CallLogsFilter, 'limit' | 'offset' | 'sortBy' | 'sortOrder'>
): Promise<CallLogsStats> => {
    const response = await api.get(`/devices/${deviceId}/call-logs/stats`, {
        params: filter,
    });
    return response.data;
};

export const deleteCallLog = async (
    deviceId: string,
    callId: string
): Promise<void> => {
    await api.delete(`/devices/${deviceId}/call-logs/${callId}`);
};

export const deleteAllCallLogs = async (deviceId: string): Promise<void> => {
    await api.delete(`/devices/${deviceId}/call-logs`);
};

export const blockNumber = async (
    deviceId: string,
    phoneNumber: string
): Promise<void> => {
    await api.post(`/devices/${deviceId}/blocked-numbers`, { phoneNumber });
};

export const getBlockedNumbers = async (
    deviceId: string
): Promise<Array<{ id: string; phoneNumber: string; dateBlocked: string }>> => {
    const response = await api.get(`/devices/${deviceId}/blocked-numbers`);
    return response.data;
};

export const unblockNumber = async (
    deviceId: string,
    blockedNumberId: string
): Promise<void> => {
    await api.delete(`/devices/${deviceId}/blocked-numbers/${blockedNumberId}`);
};

export const exportCallLogs = async (
    deviceId: string,
    format: 'csv' | 'json' | 'xlsx' = 'csv',
    filter?: CallLogsFilter
): Promise<Blob> => {
    const response = await api.get(`/devices/${deviceId}/call-logs/export`, {
        params: { ...filter, format },
        responseType: 'blob',
    });
    return response.data;
};

export const getCallRecording = async (
    deviceId: string,
    callId: string
): Promise<Blob> => {
    const response = await api.get(
        `/devices/${deviceId}/call-logs/${callId}/recording`,
        { responseType: 'blob' }
    );
    return response.data;
};

export const deleteCallRecording = async (
    deviceId: string,
    callId: string
): Promise<void> => {
    await api.delete(`/devices/${deviceId}/call-logs/${callId}/recording`);
};

export const getCallLogDetails = async (
    deviceId: string,
    callId: string
): Promise<CallLog> => {
    const response = await api.get(`/devices/${deviceId}/call-logs/${callId}`);
    return response.data;
};