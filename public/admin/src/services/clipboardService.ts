import api from './api';

export interface ClipboardItem {
    id: string;
    text?: string;
    html?: string;
    intent?: {
        action: string;
        type: string;
        extras?: Record<string, any>;
    };
    timestamp: string;
    packageName?: string;
    label?: string;
    isPinned: boolean;
    mimeTypes: string[];
}

export interface ClipboardHistoryFilter {
    startTime?: string;
    endTime?: string;
    searchQuery?: string;
    limit?: number;
    offset?: number;
    sortBy?: 'timestamp' | 'packageName';
    sortOrder?: 'asc' | 'desc';
}

export interface ClipboardStats {
    totalItems: number;
    pinnedItems: number;
    byApp: Array<{ packageName: string; count: number }>;
    byType: Array<{ type: string; count: number }>;
    byHour: Array<{ hour: number; count: number }>;
    byDay: Array<{ day: string; count: number }>;
}

/**
 * Get current clipboard content
 */
export const getClipboardContent = async (deviceId: string): Promise<ClipboardItem> => {
    const response = await api.get(`/devices/${deviceId}/clipboard`);
    return response.data;
};

/**
 * Set clipboard content
 */
export const setClipboardContent = async (
    deviceId: string,
    content: {
        text?: string;
        html?: string;
        label?: string;
        intent?: {
            action: string;
            type: string;
            extras?: Record<string, any>;
        };
    }
): Promise<ClipboardItem> => {
    const response = await api.post(`/devices/${deviceId}/clipboard`, content);
    return response.data;
};

/**
 * Clear clipboard
 */
export const clearClipboard = async (deviceId: string): Promise<void> => {
    await api.delete(`/devices/${deviceId}/clipboard`);
};

/**
 * Get clipboard history
 */
export const getClipboardHistory = async (
    deviceId: string,
    filter?: ClipboardHistoryFilter
): Promise<ClipboardItem[]> => {
    const response = await api.get(`/devices/${deviceId}/clipboard/history`, {
        params: filter,
    });
    return response.data;
};

/**
 * Get clipboard item by ID
 */
export const getClipboardItem = async (
    deviceId: string,
    itemId: string
): Promise<ClipboardItem> => {
    const response = await api.get(`/devices/${deviceId}/clipboard/items/${itemId}`);
    return response.data;
};

/**
 * Pin/unpin clipboard item
 */
export const pinClipboardItem = async (
    deviceId: string,
    itemId: string,
    pin: boolean = true
): Promise<ClipboardItem> => {
    const response = await api.patch(`/devices/${deviceId}/clipboard/items/${itemId}/pin`, {
        pin,
    });
    return response.data;
};

/**
 * Delete clipboard item
 */
export const deleteClipboardItem = async (deviceId: string, itemId: string): Promise<void> => {
    await api.delete(`/devices/${deviceId}/clipboard/items/${itemId}`);
};

/**
 * Clear clipboard history
 */
export const clearClipboardHistory = async (deviceId: string): Promise<void> => {
    await api.delete(`/devices/${deviceId}/clipboard/history`);
};

/**
 * Get clipboard stats
 */
export const getClipboardStats = async (deviceId: string): Promise<ClipboardStats> => {
    const response = await api.get(`/devices/${deviceId}/clipboard/stats`);
    return response.data;
};

/**
 * Enable/disable clipboard monitoring
 */
export const setClipboardMonitoring = async (
    deviceId: string,
    enabled: boolean
): Promise<void> => {
    await api.post(`/devices/${deviceId}/clipboard/monitoring`, { enabled });
};

/**
 * Check if clipboard monitoring is enabled
 */
export const isClipboardMonitoringEnabled = async (deviceId: string): Promise<boolean> => {
    const response = await api.get(`/devices/${deviceId}/clipboard/monitoring`);
    return response.data.enabled;
};

/**
 * Set clipboard sync state
 */
export const setClipboardSync = async (
    deviceId: string,
    enabled: boolean
): Promise<void> => {
    await api.post(`/devices/${deviceId}/clipboard/sync`, { enabled });
};

/**
 * Check if clipboard sync is enabled
 */
export const isClipboardSyncEnabled = async (deviceId: string): Promise<boolean> => {
    const response = await api.get(`/devices/${deviceId}/clipboard/sync`);
    return response.data.enabled;
};

/**
 * Set clipboard whitelist
 */
export const setClipboardWhitelist = async (
    deviceId: string,
    packageNames: string[]
): Promise<void> => {
    await api.post(`/devices/${deviceId}/clipboard/whitelist`, { packageNames });
};

/**
 * Get clipboard whitelist
 */
export const getClipboardWhitelist = async (deviceId: string): Promise<string[]> => {
    const response = await api.get(`/devices/${deviceId}/clipboard/whitelist`);
    return response.data.packageNames;
};

/**
 * Set clipboard blacklist
 */
export const setClipboardBlacklist = async (
    deviceId: string,
    packageNames: string[]
): Promise<void> => {
    await api.post(`/devices/${deviceId}/clipboard/blacklist`, { packageNames });
};

/**
 * Get clipboard blacklist
 */
export const getClipboardBlacklist = async (deviceId: string): Promise<string[]> => {
    const response = await api.get(`/devices/${deviceId}/clipboard/blacklist`);
    return response.data.packageNames;
};

/**
 * Set clipboard sync endpoint
 */
export const setClipboardSyncEndpoint = async (
    deviceId: string,
    endpoint: string,
    authToken?: string
): Promise<void> => {
    await api.post(`/devices/${deviceId}/clipboard/sync-endpoint`, { endpoint, authToken });
};

/**
 * Get clipboard sync endpoint
 */
export const getClipboardSyncEndpoint = async (
    deviceId: string
): Promise<{ endpoint?: string; isConfigured: boolean }> => {
    const response = await api.get(`/devices/${deviceId}/clipboard/sync-endpoint`);
    return response.data;
};

/**
 * Test clipboard sync
 */
export const testClipboardSync = async (deviceId: string): Promise<{ success: boolean }> => {
    const response = await api.post(`/devices/${deviceId}/clipboard/test-sync`);
    return response.data;
};

export default {
    // Clipboard Content
    getClipboardContent,
    setClipboardContent,
    clearClipboard,

    // History
    getClipboardHistory,
    getClipboardItem,
    pinClipboardItem,
    deleteClipboardItem,
    clearClipboardHistory,

    // Stats
    getClipboardStats,

    // Monitoring
    setClipboardMonitoring,
    isClipboardMonitoringEnabled,

    // Sync
    setClipboardSync,
    isClipboardSyncEnabled,
    setClipboardSyncEndpoint,
    getClipboardSyncEndpoint,
    testClipboardSync,

    // Access Control
    setClipboardWhitelist,
    getClipboardWhitelist,
    setClipboardBlacklist,
    getClipboardBlacklist,
};