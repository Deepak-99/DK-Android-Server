import api from './api';

export interface SystemInfo {
  /** Device manufacturer */
  manufacturer: string;
  /** Device model */
  model: string;
  /** Operating system version */
  osVersion: string;
  /** Android API level */
  apiLevel: number;
  /** Device serial number */
  serial: string;
  /** Device uptime in milliseconds */
  uptime: number;
  /** Total system memory in bytes */
  totalMemory: number;
  /** Available system memory in bytes */
  freeMemory: number;
  /** Device boot time (ISO string) */
  bootTime: string;
  /** List of installed apps */
  installedApps: string[];
  /** Device security patch level */
  securityPatch: string;
  /** Whether the device is rooted */
  isRooted: boolean;
  /** Device CPU information */
  cpu: {
    /** CPU architecture */
    arch: string;
    /** Number of CPU cores */
    cores: number;
    /** CPU model */
    model: string;
    /** Current CPU frequency in MHz */
    currentFreq: number;
    /** Maximum CPU frequency in MHz */
    maxFreq: number;
  };
  /** Battery information */
  battery: {
    /** Current battery level (0-100) */
    level: number;
    /** Whether the device is currently charging */
    isCharging: boolean;
    /** Battery health status */
    health: string;
    /** Battery technology (e.g., Li-ion) */
    technology: string;
    /** Battery temperature in Celsius */
    temperature: number;
    /** Battery voltage in millivolts */
    voltage: number;
  };
}

export interface SystemStats {
  /** CPU usage percentage (0-100) */
  cpuUsage: number;
  /** Memory usage in bytes */
  memoryUsage: number;
  /** Total memory in bytes */
  totalMemory: number;
  /** Free memory in bytes */
  freeMemory: number;
  /** Disk usage in bytes */
  diskUsage: number;
  /** Total disk space in bytes */
  totalDisk: number;
  /** Free disk space in bytes */
  freeDisk: number;
  /** Network traffic in bytes */
  networkTraffic: {
    /** Received bytes */
    rx: number;
    /** Transmitted bytes */
    tx: number;
  };
  /** Battery level (0-100) */
  batteryLevel: number;
  /** Whether the device is charging */
  isCharging: boolean;
  /** Device uptime in seconds */
  uptime: number;
  /** Load average (1, 5, 15 minutes) */
  loadAverage: [number, number, number];
  /** Number of processes */
  processes: number;
  /** Number of threads */
  threads: number;
  /** Number of users */
  users: number;
  /** System temperature in Celsius */
  temperature: number;
  /** System fan speed in RPM */
  fanSpeed: number;
  /** System power consumption in watts */
  powerConsumption: number;
}

/**
 * Get detailed system information
 */
export const getSystemInfo = async (): Promise<SystemInfo> => {
  try {
    const response = await api.get('/system/info');
    return response.data;
  } catch (error) {
    console.error('Failed to get system info:', error);
    throw error;
  }
};

/**
 * Get current system statistics
 */
export const getSystemStats = async (): Promise<SystemStats> => {
  try {
    const response = await api.get('/system/stats');
    return response.data;
  } catch (error) {
    console.error('Failed to get system stats:', error);
    throw error;
  }
};

/**
 * Reboot the device
 */
export const rebootDevice = async (): Promise<void> => {
  try {
    await api.post('/system/reboot');
  } catch (error) {
    console.error('Failed to reboot device:', error);
    throw error;
  }
};

/**
 * Shutdown the device
 */
export const shutdownDevice = async (): Promise<void> => {
  try {
    await api.post('/system/shutdown');
  } catch (error) {
    console.error('Failed to shutdown device:', error);
    throw error;
  }
};

/**
 * Get system logs
 * @param lines Number of lines to retrieve (default: 100)
 */
export const getSystemLogs = async (lines: number = 100): Promise<string[]> => {
  try {
    const response = await api.get(`/system/logs?lines=${lines}`);
    return response.data;
  } catch (error) {
    console.error('Failed to get system logs:', error);
    throw error;
  }
};

/**
 * Clear system logs
 */
export const clearSystemLogs = async (): Promise<void> => {
  try {
    await api.delete('/system/logs');
  } catch (error) {
    console.error('Failed to clear system logs:', error);
    throw error;
  }
};

export default {
  getSystemInfo,
  getSystemStats,
  rebootDevice,
  shutdownDevice,
  getSystemLogs,
  clearSystemLogs,
};
