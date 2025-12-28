import api from './api';

export interface AccessibilityServiceInfo {
    id: string;
    name: string;
    packageName: string;
    settingsActivity: string;
    summary: string;
    description: string;
    enabled: boolean;
    canRetrieveWindowContent: boolean;
    feedbackType: string;
    flags: number;
    capabilities: number;
}

export interface AccessibilityShortcutInfo {
    id: string;
    title: string;
    summary: string;
    enabled: boolean;
    settingsActivity: string;
    settingsComponentName: string;
}

export interface AccessibilitySettings {
    screenReaderEnabled: boolean;
    displayMagnificationEnabled: boolean;
    colorInversionEnabled: boolean;
    colorCorrectionMode: 'disabled' | 'monochromat' | 'deuteranomaly' | 'tritanomaly';
    touchExplorationEnabled: boolean;
    highTextContrastEnabled: boolean;
    autoclickEnabled: boolean;
    autoclickDelay: number;
    screenMagnificationEnabled: boolean;
    screenMagnificationScale: number;
    screenMagnificationFollowTyping: boolean;
    screenMagnificationFollowFocus: boolean;
    screenMagnificationFollowMouse: boolean;
    screenMagnificationWindowEnabled: boolean;
    screenMagnificationWindowSize: number;
    screenMagnificationWindowPosition: { x: number; y: number };

}

export interface AccessibilityEventFilter {
    eventTypes?: number[];
    packageNames?: string[];
    eventTimeRange?: {
        startTime: number;
        endTime: number;
    };
    maxEvents?: number;
}

export interface AccessibilityEvent {
    eventType: string;
    eventTime: number;
    packageName: string;
    className: string;
    text: string[];
    contentDescription: string;
    itemCount: number;
    currentItemIndex: number;
    isEnabled: boolean;
    isPassword: boolean;
    isChecked: boolean;
    isFullScreen: boolean;
    isScrollable: boolean;
    beforeText: string;
    fromIndex: number;
    toIndex: number;
    scrollX: number;
    scrollY: number;
    maxScrollX: number;
    maxScrollY: number;
    addedCount: number;
    removedCount: number;
    parcelableData: any;
    recordCount: number;
}

/**
 * Get all accessibility services
 */
export const getAccessibilityServices = async (deviceId: string): Promise<AccessibilityServiceInfo[]> => {
    const response = await api.get(`/devices/${deviceId}/accessibility/services`);
    return response.data;
};

/**
 * Enable/disable an accessibility service
 */
export const setAccessibilityServiceState = async (
    deviceId: string,
    packageName: string,
    enabled: boolean
): Promise<void> => {
    await api.post(`/devices/${deviceId}/accessibility/services/${encodeURIComponent(packageName)}/state`, { enabled });
};

/**
 * Get accessibility settings
 */
export const getAccessibilitySettings = async (deviceId: string): Promise<AccessibilitySettings> => {
    const response = await api.get(`/devices/${deviceId}/accessibility/settings`);
    return response.data;
};

/**
 * Update accessibility settings
 */
export const updateAccessibilitySettings = async (
    deviceId: string,
    settings: Partial<AccessibilitySettings>
): Promise<AccessibilitySettings> => {
    const response = await api.patch(`/devices/${deviceId}/accessibility/settings`, settings);
    return response.data;
};

/**
 * Get accessibility shortcuts
 */
export const getAccessibilityShortcuts = async (deviceId: string): Promise<AccessibilityShortcutInfo[]> => {
    const response = await api.get(`/devices/${deviceId}/accessibility/shortcuts`);
    return response.data;
};

/**
 * Set accessibility shortcut
 */
export const setAccessibilityShortcut = async (
    deviceId: string,
    shortcutId: string,
    enabled: boolean
): Promise<void> => {
    await api.post(`/devices/${deviceId}/accessibility/shortcuts/${encodeURIComponent(shortcutId)}`, { enabled });
};

/**
 * Get accessibility event log
 */
export const getAccessibilityEventLog = async (
    deviceId: string,
    filter?: AccessibilityEventFilter
): Promise<AccessibilityEvent[]> => {
    const response = await api.get(`/devices/${deviceId}/accessibility/events`, { params: filter });
    return response.data;
};

/**
 * Clear accessibility event log
 */
export const clearAccessibilityEventLog = async (deviceId: string): Promise<void> => {
    await api.delete(`/devices/${deviceId}/accessibility/events`);
};

/**
 * Perform accessibility action
 */
export const performAccessibilityAction = async (
    deviceId: string,
    action: string,
    args?: Record<string, any>
): Promise<boolean> => {
    const response = await api.post(`/devices/${deviceId}/accessibility/actions/${action}`, args);
    return response.data.success;
};

/**
 * Get accessibility node info
 */
export const getAccessibilityNodeInfo = async (
    deviceId: string,
    sourceNodeId?: string
): Promise<any> => {
    const response = await api.get(`/devices/${deviceId}/accessibility/node-info`, {
        params: { sourceNodeId }
    });
    return response.data;
};

/**
 * Take accessibility screenshot
 */
export const takeAccessibilityScreenshot = async (deviceId: string): Promise<Blob> => {
    const response = await api.get(`/devices/${deviceId}/accessibility/screenshot`, {
        responseType: 'blob'
    });
    return response.data;
};

/**
 * Get accessibility service history
 */
export const getAccessibilityServiceHistory = async (
    deviceId: string,
    limit: number = 100
): Promise<Array<{ timestamp: string; event: string; data: any }>> => {
    const response = await api.get(`/devices/${deviceId}/accessibility/history`, {
        params: { limit }
    });
    return response.data;
};

/**
 * Reset accessibility settings to defaults
 */
export const resetAccessibilitySettings = async (deviceId: string): Promise<void> => {
    await api.post(`/devices/${deviceId}/accessibility/reset`);
};

/**
 * Check if accessibility service is enabled
 */
export const isAccessibilityServiceEnabled = async (deviceId: string): Promise<boolean> => {
    const response = await api.get(`/devices/${deviceId}/accessibility/enabled`);
    return response.data.enabled;
};

export default {
    // Services
    getAccessibilityServices,
    setAccessibilityServiceState,

    // Settings
    getAccessibilitySettings,
    updateAccessibilitySettings,
    resetAccessibilitySettings,

    // Shortcuts
    getAccessibilityShortcuts,
    setAccessibilityShortcut,

    // Events
    getAccessibilityEventLog,
    clearAccessibilityEventLog,

    // Actions
    performAccessibilityAction,
    getAccessibilityNodeInfo,
    takeAccessibilityScreenshot,

    // State
    isAccessibilityServiceEnabled,
    getAccessibilityServiceHistory,
};