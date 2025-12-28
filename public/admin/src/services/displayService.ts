import api from './api';

export interface DisplayInfo {
  /** Display width in pixels */
  width: number;
  /** Display height in pixels */
  height: number;
  /** Pixels per inch */
  density: number;
  /** Refresh rate in Hz */
  refreshRate: number;
  /** Current brightness level (0-255) */
  brightness: number;
  /** Whether auto-brightness is enabled */
  autoBrightness: boolean;
  /** Current screen timeout in milliseconds */
  screenTimeout: number;
  /** Whether adaptive brightness is available */
  adaptiveBrightnessAvailable: boolean;
  /** Whether adaptive brightness is currently enabled */
  adaptiveBrightnessEnabled: boolean;
  /** Current color mode (e.g., 'natural', 'vivid', 'custom') */
  colorMode: string;
  /** Current screen resolution */
  resolution: string;
  /** Whether the screen is currently on */
  isScreenOn: boolean;
  /** Whether the device is in night mode */
  nightMode: boolean;
  /** Current display rotation (0, 90, 180, 270) */
  rotation: number;
  /** Whether auto-rotate is enabled */
  autoRotate: boolean;
}

export interface DisplaySettings {
  /** Desired brightness level (0-255) */
  brightness?: number;
  /** Whether to enable auto-brightness */
  autoBrightness?: boolean;
  /** Screen timeout in milliseconds */
  screenTimeout?: number;
  /** Whether to enable adaptive brightness */
  adaptiveBrightness?: boolean;
  /** Color mode to set */
  colorMode?: string;
  /** Whether to enable night mode */
  nightMode?: boolean;
  /** Whether to enable auto-rotate */
  autoRotate?: boolean;
}

/**
 * Get current display information
 */
export const getDisplayInfo = async (): Promise<DisplayInfo> => {
  try {
    const response = await api.get('/device/display/info');
    return response.data;
  } catch (error) {
    console.error('Failed to get display info:', error);
    throw error;
  }
};

/**
 * Update display settings
 */
export const updateDisplaySettings = async (settings: DisplaySettings): Promise<void> => {
  try {
    await api.post('/device/display/settings', settings);
  } catch (error) {
    console.error('Failed to update display settings:', error);
    throw error;
  }
};

/**
 * Set screen brightness
 * @param brightness Value between 0-255
 * @param auto Whether to enable auto-brightness
 */
export const setBrightness = async (brightness: number, auto: boolean = false): Promise<void> => {
  try {
    await api.post('/device/display/brightness', { brightness, auto });
  } catch (error) {
    console.error('Failed to set brightness:', error);
    throw error;
  }
};

/**
 * Set screen timeout
 * @param timeout Timeout in milliseconds (0 for never)
 */
export const setScreenTimeout = async (timeout: number): Promise<void> => {
  try {
    await api.post('/device/display/timeout', { timeout });
  } catch (error) {
    console.error('Failed to set screen timeout:', error);
    throw error;
  }
};

/**
 * Toggle night mode
 * @param enabled Whether to enable night mode
 */
export const setNightMode = async (enabled: boolean): Promise<void> => {
  try {
    await api.post('/device/display/nightmode', { enabled });
  } catch (error) {
    console.error('Failed to toggle night mode:', error);
    throw error;
  }
};

/**
 * Toggle auto-rotate
 * @param enabled Whether to enable auto-rotate
 */
export const setAutoRotate = async (enabled: boolean): Promise<void> => {
  try {
    await api.post('/device/display/autorotate', { enabled });
  } catch (error) {
    console.error('Failed to toggle auto-rotate:', error);
    throw error;
  }
};

/**
 * Set display color mode
 * @param mode Color mode to set (e.g., 'natural', 'vivid', 'custom')
 */
export const setColorMode = async (mode: string): Promise<void> => {
  try {
    await api.post('/device/display/colormode', { mode });
  } catch (error) {
    console.error('Failed to set color mode:', error);
    throw error;
  }
};

export default {
  getDisplayInfo,
  updateDisplaySettings,
  setBrightness,
  setScreenTimeout,
  setNightMode,
  setAutoRotate,
  setColorMode,
};
