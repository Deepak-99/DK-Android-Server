import api from './api';

/**
 * Device Settings Service
 * Handles all device configuration and system operations
 */
export interface DisplaySettings {
    brightness: number; // 0-255
    autoBrightness: boolean;
    screenTimeout: number; // in milliseconds
    fontScale: number; // 0.85 - 1.3
    screenRotation: 'auto' | 'portrait' | 'landscape';
    nightMode: 'off' | 'on' | 'auto';
    refreshRate: 'default' | 'high';
    resolution: string; // e.g., "1080x2400"
}

export interface SoundSettings {
    ringVolume: number; // 0-15
    notificationVolume: number; // 0-15
    alarmVolume: number; // 0-15
    mediaVolume: number; // 0-15
    ringtone: string;
    notificationSound: string;
    alarmSound: string;
    vibrate: boolean;
    doNotDisturb: {
        enabled: boolean;
        allowPriority: boolean;
        allowAlarms: boolean;
        allowMedia: boolean;
    };
}

export interface NetworkSettings {
    wifi: {
        enabled: boolean;
        ssid?: string;
        ipAddress?: string;
        linkSpeed?: string;
        frequency?: number;
        security?: string;
    };
    mobileData: {
        enabled: boolean;
        roaming: boolean;
        networkType?: string;
        signalStrength?: number;
    };
    bluetooth: {
        enabled: boolean;
        name?: string;
        connectedDevices: string[];
    };
    airplaneMode: boolean;
}

export interface SecuritySettings {
    screenLock: {
        type: 'none' | 'swipe' | 'pattern' | 'pin' | 'password';
        password?: string; // Only used for PIN/password
        pattern?: string; // Only used for pattern
        requirePasswordOnBoot: boolean;
        powerButtonInstantlyLocks: boolean;
        visiblePattern: boolean;
    };
    encryption: {
        status: 'encrypted' | 'encrypting' | 'unencrypted';
        type?: string;
    };
    installUnknownSources: boolean;
    verifyApps: boolean;
    screenPinning: boolean;
}

export interface BatterySettings {
    level: number; // 0-100
    status: 'charging' | 'discharging' | 'full' | 'not_charging';
    batterySaver: boolean;
    adaptiveBattery: boolean;
    optimizedCharging: boolean;
    lastFullCharge?: string;
    health: string;
    technology: string;
    temperature: number; // in Celsius
    voltage: number; // in mV
}

export interface StorageInfo {
    total: number; // in bytes
    available: number; // in bytes
    used: number; // in bytes
    apps: number;
    images: number;
    videos: number;
    audio: number;
    documents: number;
    system: number;
    cached: number;
    misc: number;
}

export interface DeviceInfo {
    id: string;
    name: string;
    manufacturer: string;
    model: string;
    androidVersion: string;
    apiLevel: number;
    securityPatch: string;
    kernelVersion: string;
    basebandVersion: string;
    buildNumber: string;
    isRooted: boolean;
    isEmulator: boolean;
    cpu: {
        abi: string;
        cores: number;
        hardware: string;
        processor: string;
    };
    memory: {
        total: number; // in bytes
        available: number; // in bytes
        lowMemory: boolean;
    };
    display: {
        resolution: string;
        density: number;
        refreshRate: number;
        size: number; // in inches
    };
    battery: BatterySettings;
    storage: {
        internal: StorageInfo;
        external?: StorageInfo;
    };
}

// Display Settings
export const getDisplaySettings = async (deviceId: string): Promise<DisplaySettings> => {
    const response = await api.get(`/devices/${deviceId}/settings/display`);
    return response.data;
};

export const updateDisplaySettings = async (
    deviceId: string,
    settings: Partial<DisplaySettings>
): Promise<DisplaySettings> => {
    const response = await api.patch(`/devices/${deviceId}/settings/display`, settings);
    return response.data;
};

// Sound Settings
export const getSoundSettings = async (deviceId: string): Promise<SoundSettings> => {
    const response = await api.get(`/devices/${deviceId}/settings/sound`);
    return response.data;
};

export const updateSoundSettings = async (
    deviceId: string,
    settings: Partial<SoundSettings>
): Promise<SoundSettings> => {
    const response = await api.patch(`/devices/${deviceId}/settings/sound`, settings);
    return response.data;
};

// Network Settings
export const getNetworkSettings = async (deviceId: string): Promise<NetworkSettings> => {
    const response = await api.get(`/devices/${deviceId}/settings/network`);
    return response.data;
};

export const updateNetworkSettings = async (
    deviceId: string,
    settings: Partial<NetworkSettings>
): Promise<NetworkSettings> => {
    const response = await api.patch(`/devices/${deviceId}/settings/network`, settings);
    return response.data;
};

// Security Settings
export const getSecuritySettings = async (deviceId: string): Promise<SecuritySettings> => {
    const response = await api.get(`/devices/${deviceId}/settings/security`);
    return response.data;
};

export const updateSecuritySettings = async (
    deviceId: string,
    settings: Partial<SecuritySettings>
): Promise<SecuritySettings> => {
    const response = await api.patch(`/devices/${deviceId}/settings/security`, settings);
    return response.data;
};

// Battery Settings
export const getBatterySettings = async (deviceId: string): Promise<BatterySettings> => {
    const response = await api.get(`/devices/${deviceId}/settings/battery`);
    return response.data;
};

export const updateBatterySettings = async (
    deviceId: string,
    settings: Partial<BatterySettings>
): Promise<BatterySettings> => {
    const response = await api.patch(`/devices/${deviceId}/settings/battery`, settings);
    return response.data;
};

// Storage
export const getStorageInfo = async (deviceId: string): Promise<{ internal: StorageInfo; external?: StorageInfo }> => {
    const response = await api.get(`/devices/${deviceId}/storage`);
    return response.data;
};

export const clearAppCache = async (deviceId: string, packageName: string): Promise<void> => {
    await api.post(`/devices/${deviceId}/storage/clear-cache`, { packageName });
};

export const clearAppData = async (deviceId: string, packageName: string): Promise<void> => {
    await api.post(`/devices/${deviceId}/storage/clear-data`, { packageName });
};

// Device Information
export const getDeviceInfo = async (deviceId: string): Promise<DeviceInfo> => {
    const response = await api.get(`/devices/${deviceId}/info`);
    return response.data;
};

// System Operations
export const rebootDevice = async (deviceId: string, mode: 'normal' | 'recovery' | 'bootloader' = 'normal'): Promise<void> => {
    await api.post(`/devices/${deviceId}/reboot`, { mode });
};

export const shutdownDevice = async (deviceId: string): Promise<void> => {
    await api.post(`/devices/${deviceId}/shutdown`);
};

export const factoryReset = async (deviceId: string, eraseExternalStorage: boolean = false): Promise<void> => {
    await api.post(`/devices/${deviceId}/factory-reset`, { eraseExternalStorage });
};

export const takeScreenshot = async (deviceId: string): Promise<Blob> => {
    const response = await api.get(`/devices/${deviceId}/screenshot`, {
        responseType: 'blob',
    });
    return response.data;
};

export const startScreenRecording = async (
    deviceId: string,
    options?: {
        bitRate?: number;
        width?: number;
        height?: number;
    }
): Promise<{ success: boolean; sessionId?: string }> => {
    const response = await api.post(`/devices/${deviceId}/screen/start`, options);
    return response.data;
};

export const stopScreenRecording = async (
    deviceId: string,
    sessionId: string
): Promise<Blob> => {
    const response = await api.post(
        `/devices/${deviceId}/screen/stop`,
        { sessionId },
        { responseType: 'blob' }
    );
    return response.data;
};

export const getBatteryStats = async (deviceId: string): Promise<{
    level: number;
    status: string;
    health: string;
    plugged: 'AC' | 'USB' | 'WIRELESS' | 'NONE';
    temperature: number;
    voltage: number;
    capacity: number;
    currentNow: number;
    chargeCounter: number;
    technology: string;
    history: Array<{
        timestamp: string;
        level: number;
        status: string;
        plugged: string;
        temperature: number;
        voltage: number;
    }>;
}> => {
    const response = await api.get(`/devices/${deviceId}/battery/stats`);
    return response.data;
};

export const getSystemLogs = async (
    deviceId: string,
    options?: {
        logLevel?: 'verbose' | 'debug' | 'info' | 'warn' | 'error';
        filter?: string;
        maxLines?: number;
    }
): Promise<string> => {
    const response = await api.get(`/devices/${deviceId}/logs/system`, {
        params: options,
    });
    return response.data;
};

export const getEventLogs = async (
    deviceId: string,
    options?: {
        filter?: string;
        maxLines?: number;
    }
): Promise<Array<{
    timestamp: string;
    type: string;
    tag: string;
    message: string;
    pid: number;
    tid: number;
}>> => {
    const response = await api.get(`/devices/${deviceId}/logs/events`, {
        params: options,
    });
    return response.data;
};

export const clearLogs = async (deviceId: string, logType: 'all' | 'system' | 'events' = 'all'): Promise<void> => {
    await api.delete(`/devices/${deviceId}/logs`, {
        params: { type: logType },
    });
};

// Device Administration
export const lockDevice = async (deviceId: string): Promise<void> => {
    await api.post(`/devices/${deviceId}/lock`);
};

export const setDevicePassword = async (
    deviceId: string,
    password: string,
    options?: {
        requirePasswordOnBoot?: boolean;
        encryptStorage?: boolean;
    }
): Promise<void> => {
    await api.post(`/devices/${deviceId}/password`, { password, ...options });
};

export const wipeDevice = async (deviceId: string, externalStorage: boolean = false): Promise<void> => {
    await api.post(`/devices/${deviceId}/wipe`, { externalStorage });
};

// Device Features
export const isFeatureSupported = async (
    deviceId: string,
    feature: string
): Promise<boolean> => {
    const response = await api.get(`/devices/${deviceId}/features/${feature}`);
    return response.data.supported;
};

export const getSupportedFeatures = async (deviceId: string): Promise<string[]> => {
    const response = await api.get(`/devices/${deviceId}/features`);
    return response.data.features;
};

// System Updates
export const checkForUpdates = async (deviceId: string): Promise<{
    available: boolean;
    currentVersion?: string;
    availableVersion?: string;
    size?: number;
    securityPatchLevel?: string;
    downloadUrl?: string;
    releaseNotes?: string;
}> => {
    const response = await api.get(`/devices/${deviceId}/updates/check`);
    return response.data;
};

export const downloadUpdate = async (deviceId: string): Promise<{
    status: 'downloading' | 'downloaded' | 'failed';
    progress?: number;
    downloadedBytes?: number;
    totalBytes?: number;
    filePath?: string;
}> => {
    const response = await api.post(`/devices/${deviceId}/updates/download`);
    return response.data;
};

export const installUpdate = async (deviceId: string): Promise<{ status: 'scheduled' | 'failed' }> => {
    const response = await api.post(`/devices/${deviceId}/updates/install`);
    return response.data;
};

export const getUpdateStatus = async (deviceId: string): Promise<{
    status: 'idle' | 'checking' | 'downloading' | 'downloaded' | 'installing' | 'failed';
    progress?: number;
    currentVersion?: string;
    availableVersion?: string;
    lastChecked?: string;
    error?: string;
}> => {
    const response = await api.get(`/devices/${deviceId}/updates/status`);
    return response.data;
};

// Backup & Restore
export const createBackup = async (
    deviceId: string,
    options?: {
        includeApps?: boolean;
        includeSharedStorage?: boolean;
        includeSystemSettings?: boolean;
        includeAccounts?: boolean;
        includeWallpaper?: boolean;
        compressionLevel?: number;
        password?: string;
    }
): Promise<{
    backupId: string;
    size: number;
    timestamp: string;
    included: string[];
}> => {
    const response = await api.post(`/devices/${deviceId}/backup`, options);
    return response.data;
};

export const restoreBackup = async (
    deviceId: string,
    backupId: string,
    options?: {
        includeApps?: boolean;
        includeSharedStorage?: boolean;
        includeSystemSettings?: boolean;
        includeAccounts?: boolean;
        includeWallpaper?: boolean;
        password?: string;
    }
): Promise<{ status: 'started' | 'in_progress' | 'completed' | 'failed'; progress?: number }> => {
    const response = await api.post(`/devices/${deviceId}/restore/${backupId}`, options);
    return response.data;
};

export const getBackupList = async (deviceId: string): Promise<
    Array<{
        id: string;
        timestamp: string;
        size: number;
        deviceModel: string;
        androidVersion: string;
        included: string[];
    }>
> => {
    const response = await api.get(`/devices/${deviceId}/backups`);
    return response.data;
};

export const deleteBackup = async (deviceId: string, backupId: string): Promise<void> => {
    await api.delete(`/devices/${deviceId}/backups/${backupId}`);
};

export const downloadBackup = async (deviceId: string, backupId: string): Promise<Blob> => {
    const response = await api.get(`/devices/${deviceId}/backups/${backupId}/download`, {
        responseType: 'blob',
    });
    return response.data;
};

export const uploadBackup = async (deviceId: string, file: File): Promise<{ backupId: string }> => {
    const formData = new FormData();
    formData.append('backup', file);

    const response = await api.post(`/devices/${deviceId}/backups/upload`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

// Device Administration
export const getDeviceAdmins = async (deviceId: string): Promise<
    Array<{
        packageName: string;
        name: string;
        description: string;
        isActive: boolean;
    }>
> => {
    const response = await api.get(`/devices/${deviceId}/admins`);
    return response.data;
};

export const setDeviceAdmin = async (
    deviceId: string,
    packageName: string,
    enabled: boolean
): Promise<void> => {
    await api.post(`/devices/${deviceId}/admins/${packageName}`, { enabled });
};

export const lockNow = async (deviceId: string): Promise<void> => {
    await api.post(`/devices/${deviceId}/lock-now`);
};

export const wipeData = async (deviceId: string, externalStorage: boolean = false): Promise<void> => {
    await api.post(`/devices/${deviceId}/wipe-data`, { externalStorage });
};

export const setPasswordQuality = async (
    deviceId: string,
    quality: 'unrestricted' | 'something' | 'numeric' | 'numeric_complex' | 'alphabetic' | 'alphanumeric' | 'complex'
): Promise<void> => {
    await api.post(`/devices/${deviceId}/password-quality`, { quality });
};

export const setPasswordMinimumLength = async (deviceId: string, length: number): Promise<void> => {
    await api.post(`/devices/${deviceId}/password-min-length`, { length });
};

export const setPasswordMinimumLetters = async (deviceId: string, count: number): Promise<void> => {
    await api.post(`/devices/${deviceId}/password-min-letters`, { count });
};

export const setPasswordMinimumLowerCase = async (deviceId: string, count: number): Promise<void> => {
    await api.post(`/devices/${deviceId}/password-min-lowercase`, { count });
};

export const setPasswordMinimumUpperCase = async (deviceId: string, count: number): Promise<void> => {
    await api.post(`/devices/${deviceId}/password-min-uppercase`, { count });
};

export const setPasswordMinimumNumeric = async (deviceId: string, count: number): Promise<void> => {
    await api.post(`/devices/${deviceId}/password-min-numeric`, { count });
};

export const setPasswordMinimumSymbols = async (deviceId: string, count: number): Promise<void> => {
    await api.post(`/devices/${deviceId}/password-min-symbols`, { count });
};

export const setPasswordMinimumNonLetter = async (deviceId: string, count: number): Promise<void> => {
    await api.post(`/devices/${deviceId}/password-min-nonletter`, { count });
};

export const setMaximumFailedPasswordsForWipe = async (deviceId: string, count: number): Promise<void> => {
    await api.post(`/devices/${deviceId}/max-failed-password-wipe`, { count });
};

export const setMaximumTimeToLock = async (deviceId: string, timeoutMs: number): Promise<void> => {
    await api.post(`/devices/${deviceId}/max-time-to-lock`, { timeoutMs });
};

export const requireEncryption = async (deviceId: string, require: boolean): Promise<void> => {
    await api.post(`/devices/${deviceId}/require-encryption`, { require });
};

export const disableCamera = async (deviceId: string, disable: boolean): Promise<void> => {
    await api.post(`/devices/${deviceId}/disable-camera`, { disable });
};

export const disableScreenCapture = async (deviceId: string, disable: boolean): Promise<void> => {
    await api.post(`/devices/${deviceId}/disable-screen-capture`, { disable });
};

export default {
    // Display
    getDisplaySettings,
    updateDisplaySettings,

    // Sound
    getSoundSettings,
    updateSoundSettings,

    // Network
    getNetworkSettings,
    updateNetworkSettings,

    // Security
    getSecuritySettings,
    updateSecuritySettings,

    // Battery
    getBatterySettings,
    updateBatterySettings,

    // Storage
    getStorageInfo,
    clearAppCache,
    clearAppData,

    // Device Info
    getDeviceInfo,

    // System Operations
    rebootDevice,
    shutdownDevice,
    factoryReset,
    takeScreenshot,
    startScreenRecording,
    stopScreenRecording,

    // Battery Stats
    getBatteryStats,

    // Logs
    getSystemLogs,
    getEventLogs,
    clearLogs,

    // Device Administration
    lockDevice,
    setDevicePassword,
    wipeDevice,

    // Features
    isFeatureSupported,
    getSupportedFeatures,

    // Updates
    checkForUpdates,
    downloadUpdate,
    installUpdate,
    getUpdateStatus,

    // Backup & Restore
    createBackup,
    restoreBackup,
    getBackupList,
    deleteBackup,
    downloadBackup,
    uploadBackup,

    // Device Administration (Advanced)
    getDeviceAdmins,
    setDeviceAdmin,
    lockNow,
    wipeData,
    setPasswordQuality,
    setPasswordMinimumLength,
    setPasswordMinimumLetters,
    setPasswordMinimumLowerCase,
    setPasswordMinimumUpperCase,
    setPasswordMinimumNumeric,
    setPasswordMinimumSymbols,
    setPasswordMinimumNonLetter,
    setMaximumFailedPasswordsForWipe,
    setMaximumTimeToLock,
    requireEncryption,
    disableCamera,
    disableScreenCapture,
};