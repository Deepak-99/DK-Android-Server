import api from './api';

export interface AppInfo {
    packageName: string;
    name: string;
    versionName?: string;
    versionCode?: number;
    icon?: string; // Base64 encoded icon
    firstInstallTime: string;
    lastUpdateTime: string;
    targetSdkVersion?: number;
    minSdkVersion?: number;
    permissions: string[];
    requestedPermissions: Array<{
        name: string;
        granted: boolean;
        flags: number;
    }>;
    sharedUserId?: string;
    sharedUserLabel?: string;
    dataDir?: string;
    sourceDir?: string;
    nativeLibraryDir?: string;
    publicSourceDir?: string;
    splitSourceDirs?: string[];
    splitPublicSourceDirs?: string[];
    splitNames?: string[];
    isSystem: boolean;
    isEnabled: boolean;
    isUpdatedSystemApp: boolean;
    isInstantApp: boolean;
    isVirtualPreload: boolean;
    isSplitRequired: boolean;
    isGame: boolean;
    category?: string;
    launchIntent?: string;
    installLocation?: number;
    size: number;
    cacheSize?: number;
    dataSize?: number;
    externalCacheSize?: number;
    externalDataSize?: number;
    externalMediaSize?: number;
    externalObbSize?: number;
    flags?: number;
    description?: string;
    installerPackageName?: string;
    requestedPermissionsFlags?: number[];
    sharedLibraryInfos?: Array<{
        name: string;
        filename: string;
    }>;
    signingInfo?: {
        signatures: Array<{
            hash: string;
            algorithm: string;
        }>;
    };
}

export interface AppUsageStats {
    packageName: string;
    lastTimeUsed: string;
    lastTimeVisible?: string;
    lastTimeForegroundServiceUsed?: string;
    lastTimeVisibleUpdated?: string;
    totalTimeInForeground: number; // in milliseconds
    lastTimeActive?: string;
    lastTimeComponentUsed?: string;
    lastTimeServiceUsed?: string;
    lastTimeBackground?: string;
    totalTimeVisible?: number;
    totalTimeServiceUsed?: number;
    totalTimeComponentUsed?: number;
    totalTimeActive?: number;
    totalTimeBackground?: number;
    appLaunchCount?: number;
    packageToken?: number;
    appStandbyBucket?: number;
    lastTimeUnplugged?: string;
    totalTimeUnplugged?: number;
}

export interface AppFilter {
    systemApps?: boolean;
    enabledOnly?: boolean;
    searchQuery?: string;
    minSdkVersion?: number;
    hasPermission?: string;
    category?: string;
    sortBy?: 'name' | 'size' | 'installTime' | 'updateTime';
    sortOrder?: 'asc' | 'desc';
    limit?: number;
    offset?: number;
}

export interface AppUsageFilter {
    startTime: string;
    endTime: string;
    interval?: 'daily' | 'weekly' | 'monthly' | 'yearly';
    includeSystemApps?: boolean;
    includeUninstalled?: boolean;
    minUsageTime?: number; // in minutes
}

export interface AppUsageSummary {
    totalUsage: number;
    foregroundTime: number;
    backgroundTime: number;
    launchCount: number;
    lastUsed: string;
    batteryUsage?: number; // in mAh
    mobileDataUsage?: number; // in bytes
    wifiDataUsage?: number; // in bytes
    notifications?: number;
    crashes?: number;
    anrCount?: number;
}

export const getInstalledApps = async (
    deviceId: string,
    filter?: AppFilter
): Promise<AppInfo[]> => {
    const response = await api.get(`/devices/${deviceId}/apps`, {
        params: filter,
    });
    return response.data;
};

export const getAppInfo = async (
    deviceId: string,
    packageName: string
): Promise<AppInfo> => {
    const response = await api.get(`/devices/${deviceId}/apps/${encodeURIComponent(packageName)}`);
    return response.data;
};

export const getAppUsageStats = async (
    deviceId: string,
    filter: AppUsageFilter
): Promise<Record<string, AppUsageStats>> => {
    const response = await api.get(`/devices/${deviceId}/apps/usage`, {
        params: filter,
    });
    return response.data;
};

export const getAppUsageSummary = async (
    deviceId: string,
    packageName: string,
    startTime: string,
    endTime: string
): Promise<AppUsageSummary> => {
    const response = await api.get(`/devices/${deviceId}/apps/${encodeURIComponent(packageName)}/usage`, {
        params: { startTime, endTime },
    });
    return response.data;
};

export const enableApp = async (
    deviceId: string,
    packageName: string
): Promise<void> => {
    await api.post(`/devices/${deviceId}/apps/${encodeURIComponent(packageName)}/enable`);
};

export const disableApp = async (
    deviceId: string,
    packageName: string
): Promise<void> => {
    await api.post(`/devices/${deviceId}/apps/${encodeURIComponent(packageName)}/disable`);
};

export const uninstallApp = async (
    deviceId: string,
    packageName: string,
    keepData: boolean = false
): Promise<void> => {
    await api.delete(`/devices/${deviceId}/apps/${encodeURIComponent(packageName)}`, {
        params: { keepData },
    });
};

export const clearAppData = async (
    deviceId: string,
    packageName: string
): Promise<{ success: boolean; clearedData: number }> => {
    const response = await api.post(`/devices/${deviceId}/apps/${encodeURIComponent(packageName)}/clear-data`);
    return response.data;
};

export const clearAppCache = async (
    deviceId: string,
    packageName: string
): Promise<{ success: boolean; clearedCache: number }> => {
    const response = await api.post(`/devices/${deviceId}/apps/${encodeURIComponent(packageName)}/clear-cache`);
    return response.data;
};

export const forceStopApp = async (
    deviceId: string,
    packageName: string
): Promise<void> => {
    await api.post(`/devices/${deviceId}/apps/${encodeURIComponent(packageName)}/force-stop`);
};

export const grantPermission = async (
    deviceId: string,
    packageName: string,
    permission: string
): Promise<void> => {
    await api.post(`/devices/${deviceId}/apps/${encodeURIComponent(packageName)}/permissions/grant`, {
        permission,
    });
};

export const revokePermission = async (
    deviceId: string,
    packageName: string,
    permission: string
): Promise<void> => {
    await api.post(`/devices/${deviceId}/apps/${encodeURIComponent(packageName)}/permissions/revoke`, {
        permission,
    });
};

export const getAppPermissions = async (
    deviceId: string,
    packageName: string
): Promise<Array<{
    name: string;
    granted: boolean;
    flags: number;
    protection: string;
    protectionFlags: number;
    group?: string;
    description?: string;
    backgroundPermission?: string;
}>> => {
    const response = await api.get(`/devices/${deviceId}/apps/${encodeURIComponent(packageName)}/permissions`);
    return response.data;
};

export const getAppActivities = async (
    deviceId: string,
    packageName: string
): Promise<Array<{
    name: string;
    exported: boolean;
    permission?: string;
    taskAffinity?: string;
    launchMode?: string;
    screenOrientation?: string;
    configChanges?: string;
    theme?: string;
    uiOptions?: string;
}>> => {
    const response = await api.get(`/devices/${deviceId}/apps/${encodeURIComponent(packageName)}/activities`);
    return response.data;
};

export const getAppServices = async (
    deviceId: string,
    packageName: string
): Promise<Array<{
    name: string;
    exported: boolean;
    permission?: string;
    processName?: string;
    enabled: boolean;
    isolatedProcess: boolean;
    foregroundServiceType?: string;
    flags?: number;
}>> => {
    const response = await api.get(`/devices/${deviceId}/apps/${encodeURIComponent(packageName)}/services`);
    return response.data;
};

export const getAppReceivers = async (
    deviceId: string,
    packageName: string
): Promise<Array<{
    name: string;
    exported: boolean;
    permission?: string;
    processName?: string;
    enabled: boolean;
}>> => {
    const response = await api.get(`/devices/${deviceId}/apps/${encodeURIComponent(packageName)}/receivers`);
    return response.data;
};

export const getAppProviders = async (
    deviceId: string,
    packageName: string
): Promise<Array<{
    name: string;
    exported: boolean;
    permission?: string;
    processName?: string;
    enabled: boolean;
    syncable: boolean;
    readPermission?: string;
    writePermission?: string;
    multiprocess: boolean;
    initOrder: number;
    flags: number;
    authority: string;
}>> => {
    const response = await api.get(`/devices/${deviceId}/apps/${encodeURIComponent(packageName)}/providers`);
    return response.data;
};

export const getAppPermissionsGroups = async (
    deviceId: string,
    packageName: string
): Promise<Array<{
    name: string;
    description?: string;
    priority: number;
    request: string;
    backgroundRequest?: string;
    backgroundRequestDetail?: string;
    requestDetail?: string;
    flags: number;
}>> => {
    const response = await api.get(`/devices/${deviceId}/apps/${encodeURIComponent(packageName)}/permission-groups`);
    return response.data;
};

export const getAppSharedLibraries = async (
    deviceId: string,
    packageName: string
): Promise<Array<{
    name: string;
    type: string;
    path: string;
    version: number;
    isNative: boolean;
}>> => {
    const response = await api.get(`/devices/${deviceId}/apps/${encodeURIComponent(packageName)}/libraries`);
    return response.data;
};

export const getAppBackup = async (
    deviceId: string,
    packageName: string
): Promise<Blob> => {
    const response = await api.get(`/devices/${deviceId}/apps/${encodeURIComponent(packageName)}/backup`, {
        responseType: 'blob',
    });
    return response.data;
};

export const installApp = async (
    deviceId: string,
    apkFile: File,
    options?: {
        replace?: boolean;
        testOnly?: boolean;
        downgrade?: boolean;
        grantPermissions?: boolean;
        installerPackageName?: string;
    }
): Promise<{ success: boolean; message: string }> => {
    const formData = new FormData();
    formData.append('apk', apkFile);
    if (options) {
        Object.entries(options).forEach(([key, value]) => {
            formData.append(key, value.toString());
        });
    }

    const response = await api.post(`/devices/${deviceId}/apps/install`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

export const getAppIcon = async (
    deviceId: string,
    packageName: string,
    size: number = 120
): Promise<Blob> => {
    const response = await api.get(`/devices/${deviceId}/apps/${encodeURIComponent(packageName)}/icon`, {
        params: { size },
        responseType: 'blob',
    });
    return response.data;
};

export const getAppScreenshots = async (
    deviceId: string,
    packageName: string
): Promise<Array<{ url: string; width: number; height: number }>> => {
    const response = await api.get(`/devices/${deviceId}/apps/${encodeURIComponent(packageName)}/screenshots`);
    return response.data;
};

export const getAppStoreInfo = async (
    deviceId: string,
    packageName: string
): Promise<{
    storeUrl?: string;
    versionCode?: number;
    versionName?: string;
    installs?: string;
    minAndroidVersion?: string;
    lastUpdated?: string;
    size?: number;
    contentRating?: string;
    developer?: {
        name?: string;
        website?: string;
        email?: string;
        address?: string;
    };
    price?: string;
    rating?: number;
    ratingCount?: number;
    description?: string;
    recentChanges?: string;
    category?: string;
    ageRating?: string;
    containsAds?: boolean;
    inAppPurchases?: boolean;
    permissions?: Array<{
        name: string;
        description: string;
        isDangerous: boolean;
    }>;
}> => {
    const response = await api.get(`/devices/${deviceId}/apps/${encodeURIComponent(packageName)}/store-info`);
    return response.data;
};