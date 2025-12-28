import api from './api';

export interface Notification {
    id: string;
    packageName: string;
    appName: string;
    appIcon?: string;
    title: string;
    text: string;
    subText?: string;
    largeIcon?: string;
    largeIconBitmap?: string;
    picture?: string;
    bigText?: string;
    bigPicture?: string;
    infoText?: string;
    summaryText?: string;
    tickerText?: string;
    when: string;
    isOngoing: boolean;
    isClearable: boolean;
    isGroupSummary: boolean;
    groupKey?: string;
    sortKey?: string;
    category?: string;
    priority: number;
    color?: string;
    sound?: string;
    vibrationPattern?: number[];
    ledARGB?: number;
    ledOnMS?: number;
    ledOffMS?: number;
    defaults?: number;
    flags?: number;
    actions: NotificationAction[];
    extras?: Record<string, any>;
    visibility: 'public' | 'private' | 'secret';
    importance?: 'none' | 'min' | 'low' | 'default' | 'high' | 'max';
    channelId?: string;
    channelName?: string;
    group?: string;
    isGroup: boolean;
    children?: Notification[];
    user: number;
    isRemoved: boolean;
    isPosted: boolean;
    hasReply: boolean;
    isDismissed: boolean;
}

export interface NotificationAction {
    title: string;
    action: string;
    icon?: string;
    remoteInputs?: NotificationRemoteInput[];
    allowGeneratedReplies?: boolean;
    showsUserInterface?: boolean;
    isAuthenticationRequired?: boolean;
    isContextual?: boolean;
    isSelectedWhenLauncher?: boolean;
    semanticAction?: number;
}

export interface NotificationRemoteInput {
    resultKey: string;
    label?: string;
    choices?: string[];
    allowFreeFormInput?: boolean;
    allowedDataTypes?: string[];
    extras?: Record<string, any>;
}

export interface NotificationChannel {
    id: string;
    name: string;
    description?: string;
    importance: 'none' | 'min' | 'low' | 'default' | 'high' | 'max';
    canBypassDnd: boolean;
    canShowBadge: boolean;
    description?: string;
    group?: string;
    lightColor: number;
    lockscreenVisibility: 'public' | 'private' | 'secret';
    showLights: boolean;
    showVibrate: boolean;
    sound?: string;
    vibrationPattern?: number[];
    enableLights: boolean;
    enableVibration: boolean;
}

export interface NotificationListener {
    id: string;
    packageName: string;
    componentName: string;
    userId: number;
    isListenerConfigured: boolean;
    isListenerEnabled: boolean;
    isPackageEnabled: boolean;
    isListenerPermissionGranted: boolean;
    isNotificationAccessGranted: boolean;
    isNotificationListenerEnabled: boolean;
    isNotificationPolicyAccessGranted: boolean;
    isNotificationAssistant: boolean;
    isNotificationPolicyAccessGrantedForPackage: boolean;
    isNotificationListenerAccessGranted: boolean;
    isNotificationAssistantAccessGranted: boolean;
    isNotificationListenerAccessGrantedForType: boolean;
    isNotificationAssistantAccessGrantedForType: boolean;
}

export interface NotificationStats {
    total: number;
    active: number;
    snoozed: number;
    dismissed: number;
    byApp: Array<{ packageName: string; count: number; appName: string }>;
    byHour: Array<{ hour: number; count: number }>;
    byDay: Array<{ day: string; count: number }>;
    byCategory: Array<{ category: string; count: number }>;
}

export interface NotificationFilter {
    packageName?: string;
    category?: string;
    isOngoing?: boolean;
    isGroupSummary?: boolean;
    isClearable?: boolean;
    hasReply?: boolean;
    minImportance?: 'none' | 'min' | 'low' | 'default' | 'high' | 'max';
    searchQuery?: string;
    startTime?: string;
    endTime?: string;
    limit?: number;
    offset?: number;
    sortBy?: 'time' | 'app' | 'importance';
    sortOrder?: 'asc' | 'desc';
}

/**
 * Get all active notifications
 */
export const getActiveNotifications = async (
    deviceId: string,
    filter?: NotificationFilter
): Promise<Notification[]> => {
    const response = await api.get(`/devices/${deviceId}/notifications`, {
        params: filter,
    });
    return response.data;
};

/**
 * Get notification history
 */
export const getNotificationHistory = async (
    deviceId: string,
    filter?: Omit<NotificationFilter, 'isOngoing' | 'isClearable'>
): Promise<Notification[]> => {
    const response = await api.get(`/devices/${deviceId}/notifications/history`, {
        params: filter,
    });
    return response.data;
};

/**
 * Get notification by ID
 */
export const getNotification = async (
    deviceId: string,
    notificationId: string
): Promise<Notification> => {
    const response = await api.get(`/devices/${deviceId}/notifications/${notificationId}`);
    return response.data;
};

/**
 * Dismiss a notification
 */
export const dismissNotification = async (
    deviceId: string,
    notificationId: string
): Promise<void> => {
    await api.post(`/devices/${deviceId}/notifications/${notificationId}/dismiss`);
};

/**
 * Dismiss all notifications
 */
export const dismissAllNotifications = async (deviceId: string): Promise<void> => {
    await api.post(`/devices/${deviceId}/notifications/dismiss-all`);
};

/**
 * Send a reply to a notification
 */
export const replyToNotification = async (
    deviceId: string,
    notificationId: string,
    message: string
): Promise<void> => {
    await api.post(`/devices/${deviceId}/notifications/${notificationId}/reply`, { message });
};

/**
 * Perform an action on a notification
 */
export const performNotificationAction = async (
    deviceId: string,
    notificationId: string,
    action: string,
    text?: string
): Promise<void> => {
    await api.post(`/devices/${deviceId}/notifications/${notificationId}/action`, {
        action,
        text,
    });
};

/**
 * Get notification channels
 */
export const getNotificationChannels = async (
    deviceId: string,
    packageName?: string
): Promise<NotificationChannel[]> => {
    const response = await api.get(`/devices/${deviceId}/notifications/channels`, {
        params: { packageName },
    });
    return response.data;
};

/**
 * Get notification channel groups
 */
export const getNotificationChannelGroups = async (
    deviceId: string,
    packageName?: string
): Promise<Array<{ id: string; name: string; channels: NotificationChannel[] }>> => {
    const response = await api.get(`/devices/${deviceId}/notifications/channel-groups`, {
        params: { packageName },
    });
    return response.data;
};

/**
 * Get notification listeners
 */
export const getNotificationListeners = async (
    deviceId: string
): Promise<NotificationListener[]> => {
    const response = await api.get(`/devices/${deviceId}/notifications/listeners`);
    return response.data;
};

/**
 * Get notification stats
 */
export const getNotificationStats = async (
    deviceId: string,
    startTime?: string,
    endTime?: string
): Promise<NotificationStats> => {
    const response = await api.get(`/devices/${deviceId}/notifications/stats`, {
        params: { startTime, endTime },
    });
    return response.data;
};

/**
 * Set notification importance
 */
export const setNotificationImportance = async (
    deviceId: string,
    packageName: string,
    importance: 'none' | 'min' | 'low' | 'default' | 'high' | 'max'
): Promise<void> => {
    await api.post(`/devices/${deviceId}/notifications/importance`, {
        packageName,
        importance,
    });
};

/**
 * Block notifications from an app
 */
export const blockNotifications = async (
    deviceId: string,
    packageName: string
): Promise<void> => {
    await api.post(`/devices/${deviceId}/notifications/block`, { packageName });
};

/**
 * Unblock notifications from an app
 */
export const unblockNotifications = async (
    deviceId: string,
    packageName: string
): Promise<void> => {
    await api.post(`/devices/${deviceId}/notifications/unblock`, { packageName });
};

/**
 * Get blocked notification packages
 */
export const getBlockedNotificationPackages = async (
    deviceId: string
): Promise<Array<{ packageName: string; appName: string }>> => {
    const response = await api.get(`/devices/${deviceId}/notifications/blocked`);
    return response.data;
};

/**
 * Set notification channel importance
 */
export const setNotificationChannelImportance = async (
    deviceId: string,
    channelId: string,
    importance: 'none' | 'min' | 'low' | 'default' | 'high' | 'max'
): Promise<void> => {
    await api.post(`/devices/${deviceId}/notifications/channels/${channelId}/importance`, {
        importance,
    });
};

/**
 * Delete notification channel
 */
export const deleteNotificationChannel = async (
    deviceId: string,
    channelId: string
): Promise<void> => {
    await api.delete(`/devices/${deviceId}/notifications/channels/${channelId}`);
};

/**
 * Create notification channel
 */
export const createNotificationChannel = async (
    deviceId: string,
    channel: Omit<NotificationChannel, 'id'>
): Promise<NotificationChannel> => {
    const response = await api.post(`/devices/${deviceId}/notifications/channels`, channel);
    return response.data;
};

/**
 * Update notification channel
 */
export const updateNotificationChannel = async (
    deviceId: string,
    channelId: string,
    updates: Partial<Omit<NotificationChannel, 'id'>>
): Promise<NotificationChannel> => {
    const response = await api.patch(
        `/devices/${deviceId}/notifications/channels/${channelId}`,
        updates
    );
    return response.data;
};

/**
 * Get notification policy
 */
export const getNotificationPolicy = async (
    deviceId: string
): Promise<{
    priorityCallSenders: number;
    priorityMessageSenders: number;
    priorityCategories: string[];
    suppressedVisualEffects: number;
    notificationListeners: Array<{
        component: string;
        user: number;
        isListener: boolean;
    }>;
}> => {
    const response = await api.get(`/devices/${deviceId}/notifications/policy`);
    return response.data;
};

/**
 * Set notification policy
 */
export const setNotificationPolicy = async (
    deviceId: string,
    policy: {
        priorityCallSenders?: number;
        priorityMessageSenders?: number;
        priorityCategories?: string[];
        suppressedVisualEffects?: number;
    }
): Promise<void> => {
    await api.post(`/devices/${deviceId}/notifications/policy`, policy);
};

/**
 * Get notification listener hooks
 */
export const getNotificationListenerHooks = async (
    deviceId: string
): Promise<Array<{ event: string; script: string }>> => {
    const response = await api.get(`/devices/${deviceId}/notifications/hooks`);
    return response.data;
};

/**
 * Set notification listener hook
 */
export const setNotificationListenerHook = async (
    deviceId: string,
    event: string,
    script: string
): Promise<void> => {
    await api.post(`/devices/${deviceId}/notifications/hooks`, { event, script });
};

/**
 * Delete notification listener hook
 */
export const deleteNotificationListenerHook = async (
    deviceId: string,
    event: string
): Promise<void> => {
    await api.delete(`/devices/${deviceId}/notifications/hooks/${event}`);
};

/**
 * Test notification
 */
export const sendTestNotification = async (
    deviceId: string,
    notification: {
        title: string;
        text: string;
        packageName?: string;
        channelId?: string;
        importance?: 'none' | 'min' | 'low' | 'default' | 'high' | 'max';
        actions?: Array<{
            title: string;
            action: string;
            icon?: string;
        }>;
    }
): Promise<void> => {
    await api.post(`/devices/${deviceId}/notifications/test`, notification);
};

export default {
    // Notifications
    getActiveNotifications,
    getNotificationHistory,
    getNotification,
    dismissNotification,
    dismissAllNotifications,
    replyToNotification,
    performNotificationAction,

    // Channels
    getNotificationChannels,
    getNotificationChannelGroups,
    createNotificationChannel,
    updateNotificationChannel,
    deleteNotificationChannel,
    setNotificationChannelImportance,

    // Listeners
    getNotificationListeners,

    // Stats
    getNotificationStats,

    // Management
    setNotificationImportance,
    blockNotifications,
    unblockNotifications,
    getBlockedNotificationPackages,
    getNotificationPolicy,
    setNotificationPolicy,

    // Hooks
    getNotificationListenerHooks,
    setNotificationListenerHook,
    deleteNotificationListenerHook,

    // Testing
    sendTestNotification,
};