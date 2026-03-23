import api from './api';

export interface AppInfo {
  /** Package name (e.g., com.example.app) */
  packageName: string;
  /** Application name */
  name: string;
  /** Application version name */
  versionName: string;
  /** Application version code */
  versionCode: number;
  /** Application icon (base64 encoded) */
  icon: string;
  /** Installation date (ISO string) */
  installDate: string;
  /** Last update date (ISO string) */
  updateDate: string;
  /** Target SDK version */
  targetSdk: number;
  /** Minimum SDK version */
  minSdk: number;
  /** Whether the app is a system app */
  isSystemApp: boolean;
  /** Whether the app is enabled */
  isEnabled: boolean;
  /** Storage used by the app in bytes */
  storageUsed: number;
  /** Data storage used by the app in bytes */
  dataUsed: number;
  /** Cache size in bytes */
  cacheSize: number;
  /** Permissions requested by the app */
  permissions: string[];
  /** Main activity class name */
  mainActivity: string;
  /** Whether the app is currently running */
  isRunning: boolean;
  /** Whether the app is in foreground */
  isForeground: boolean;
  /** UID of the application */
  uid: number;
  /** Installer package name */
  installer: string | null;
  /** APK path */
  sourceDir: string;
  /** Data directory */
  dataDir: string;
}

export interface AppStats {
  /** Number of apps installed */
  totalApps: number;
  /** Number of system apps */
  systemApps: number;
  /** Number of user apps */
  userApps: number;
  /** Number of disabled apps */
  disabledApps: number;
  /** Number of running apps */
  runningApps: number;
  /** Total storage used by all apps in bytes */
  totalStorageUsed: number;
  /** Total data used by all apps in bytes */
  totalDataUsed: number;
  /** Total cache size in bytes */
  totalCacheSize: number;
}

/**
 * Get list of all installed applications
 */
export const getInstalledApps = async (): Promise<AppInfo[]> => {
  try {
    const response = await api.get('/apps/installed');
    return response.data;
  } catch (error) {
    console.error('Failed to get installed apps:', error);
    throw error;
  }
};

/**
 * Get information about a specific application
 * @param packageName Package name of the application
 */
export const getAppInfo = async (packageName: string): Promise<AppInfo> => {
  try {
    const response = await api.get(`/apps/info/${encodeURIComponent(packageName)}`);
    return response.data;
  } catch (error) {
    console.error(`Failed to get info for app ${packageName}:`, error);
    throw error;
  }
};

/**
 * Get application statistics
 */
export const getAppStats = async (): Promise<AppStats> => {
  try {
    const response = await api.get('/apps/stats');
    return response.data;
  } catch (error) {
    console.error('Failed to get app statistics:', error);
    throw error;
  }
};

/**
 * Launch an application
 * @param packageName Package name of the application to launch
 */
export const launchApp = async (packageName: string): Promise<void> => {
  try {
    await api.post(`/apps/launch/${encodeURIComponent(packageName)}`);
  } catch (error) {
    console.error(`Failed to launch app ${packageName}:`, error);
    throw error;
  }
};

/**
 * Force stop an application
 * @param packageName Package name of the application to stop
 */
export const stopApp = async (packageName: string): Promise<void> => {
  try {
    await api.post(`/apps/stop/${encodeURIComponent(packageName)}`);
  } catch (error) {
    console.error(`Failed to stop app ${packageName}:`, error);
    throw error;
  }
};

/**
 * Clear application data and cache
 * @param packageName Package name of the application
 */
export const clearAppData = async (packageName: string): Promise<void> => {
  try {
    await api.delete(`/apps/data/${encodeURIComponent(packageName)}`);
  } catch (error) {
    console.error(`Failed to clear data for app ${packageName}:`, error);
    throw error;
  }
};

/**
 * Uninstall an application
 * @param packageName Package name of the application to uninstall
 * @param keepData Whether to keep the application data and cache directories
 */
export const uninstallApp = async (packageName: string, keepData: boolean = false): Promise<void> => {
  try {
    await api.delete(`/apps/uninstall/${encodeURIComponent(packageName)}?keepData=${keepData}`);
  } catch (error) {
    console.error(`Failed to uninstall app ${packageName}:`, error);
    throw error;
  }
};

/**
 * Enable or disable an application
 * @param packageName Package name of the application
 * @param enabled Whether to enable or disable the application
 */
export const setAppEnabled = async (packageName: string, enabled: boolean): Promise<void> => {
  try {
    await api.post(`/apps/${enabled ? 'enable' : 'disable'}/${encodeURIComponent(packageName)}`);
  } catch (error) {
    console.error(`Failed to ${enabled ? 'enable' : 'disable'} app ${packageName}:`, error);
    throw error;
  }
};

/**
 * Grant or revoke a permission for an application
 * @param packageName Package name of the application
 * @param permission Permission to grant or revoke
 * @param granted Whether to grant or revoke the permission
 */
export const setAppPermission = async (
  packageName: string,
  permission: string,
  granted: boolean
): Promise<void> => {
  try {
    await api.post(`/apps/permission/${encodeURIComponent(packageName)}`, {
      permission,
      granted,
    });
  } catch (error) {
    console.error(
      `Failed to ${granted ? 'grant' : 'revoke'} permission ${permission} for app ${packageName}:`,
      error
    );
    throw error;
  }
};

export default {
  getInstalledApps,
  getAppInfo,
  getAppStats,
  launchApp,
  stopApp,
  clearAppData,
  uninstallApp,
  setAppEnabled,
  setAppPermission,
};
