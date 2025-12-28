import api from './api';

export interface SMSMessage {
    id: string;
    threadId: string;
    address: string;
    contactName?: string;
    body: string;
    date: string;
    type: 'inbox' | 'sent' | 'draft' | 'outbox' | 'failed' | 'queued';
    read: boolean;
    seen: boolean;
    locked: boolean;
    subId?: number;
    errorCode?: number;
    creator?: string;
    serviceCenter?: string;
    subscriptionId?: string;
    status?: number;
    isMms: boolean;
    mms?: MMSDetails;
}

export interface MMSDetails {
    messageId: string;
    messageType: number;
    contentType: string;
    contentLocation: string;
    content: Array<{
        contentType: string;
        contentUri: string;
        fileName?: string;
        text?: string;
    }>;
    expiry: number;
    messageSize: number;
    transactionId: string;
    partCount: number;
    parts: Array<{
        id: string;
        contentType: string;
        name: string;
        data: string;
    }>;
}

export interface SMSThread {
    id: string;
    address: string;
    contactName?: string;
    messageCount: number;
    date: string;
    snippet: string;
    read: boolean;
    hasUnread: boolean;
    photoUri?: string;
    recipients: string[];
    lastMessageType: string;
}

export interface SMSFilter {
    threadId?: string;
    address?: string;
    startDate?: string;
    endDate?: string;
    type?: string;
    read?: boolean;
    searchQuery?: string;
    limit?: number;
    offset?: number;
    sortBy?: 'date' | 'type' | 'address';
    sortOrder?: 'asc' | 'desc';
}

export interface SMSStats {
    total: number;
    inbox: number;
    sent: number;
    draft: number;
    outbox: number;
    failed: number;
    byDate: Array<{ date: string; count: number }>;
    byContact: Array<{ address: string; name?: string; count: number }>;
    storageUsage: {
        total: number;
        used: number;
        free: number;
        mmsCount: number;
        smsCount: number;
    };
}

export const getSMSThreads = async (
    deviceId: string,
    filter?: Omit<SMSFilter, 'threadId' | 'address'>
): Promise<SMSThread[]> => {
    const response = await api.get(`/devices/${deviceId}/sms/threads`, {
        params: filter,
    });
    return response.data;
};

export const getSMSMessages = async (
    deviceId: string,
    threadId: string,
    filter?: Omit<SMSFilter, 'threadId'>
): Promise<SMSMessage[]> => {
    const response = await api.get(`/devices/${deviceId}/sms/threads/${threadId}/messages`, {
        params: filter,
    });
    return response.data;
};

export const getSMSMessage = async (
    deviceId: string,
    messageId: string
): Promise<SMSMessage> => {
    const response = await api.get(`/devices/${deviceId}/sms/messages/${messageId}`);
    return response.data;
};

export const sendSMS = async (
    deviceId: string,
    recipients: string | string[],
    message: string,
    options?: {
        threadId?: string;
        subscriptionId?: number;
        deliveryReport?: boolean;
        priority?: 'normal' | 'high';
    }
): Promise<{ success: boolean; messageId: string }> => {
    const response = await api.post(`/devices/${deviceId}/sms/send`, {
        recipients: Array.isArray(recipients) ? recipients : [recipients],
        message,
        ...options,
    });
    return response.data;
};

export const deleteSMSMessage = async (
    deviceId: string,
    messageId: string
): Promise<void> => {
    await api.delete(`/devices/${deviceId}/sms/messages/${messageId}`);
};

export const deleteSMSThread = async (
    deviceId: string,
    threadId: string
): Promise<void> => {
    await api.delete(`/devices/${deviceId}/sms/threads/${threadId}`);
};

export const markAsRead = async (
    deviceId: string,
    messageIds: string | string[],
    read: boolean = true
): Promise<void> => {
    await api.patch(`/devices/${deviceId}/sms/messages/read`, {
        messageIds: Array.isArray(messageIds) ? messageIds : [messageIds],
        read,
    });
};

export const getSMSStats = async (
    deviceId: string,
    filter?: Omit<SMSFilter, 'limit' | 'offset' | 'sortBy' | 'sortOrder'>
): Promise<SMSStats> => {
    const response = await api.get(`/devices/${deviceId}/sms/stats`, {
        params: filter,
    });
    return response.data;
};

export const exportSMS = async (
    deviceId: string,
    format: 'csv' | 'json' | 'xlsx' = 'csv',
    filter?: SMSFilter
): Promise<Blob> => {
    const response = await api.get(`/devices/${deviceId}/sms/export`, {
        params: { ...filter, format },
        responseType: 'blob',
    });
    return response.data;
};

export const backupSMS = async (
    deviceId: string,
    format: 'xml' | 'json' = 'xml'
): Promise<Blob> => {
    const response = await api.get(`/devices/${deviceId}/sms/backup`, {
        params: { format },
        responseType: 'blob',
    });
    return response.data;
};

export const restoreSMS = async (
    deviceId: string,
    file: File
): Promise<{ success: boolean; restored: number; failed: number }> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post(`/devices/${deviceId}/sms/restore`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
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