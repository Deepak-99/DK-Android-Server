import api from './api';

export interface InputMethodInfo {
    id: string;
    packageName: string;
    className: string;
    isDefault: boolean;
    isEnabled: boolean;
    settingsActivity?: string;
    label: string;
    icon?: string;
    subtypeCount: number;
    subtypes: InputMethodSubtype[];
}

export interface InputMethodSubtype {
    id: string;
    name: string;
    locale: string;
    mode: string;
    imeSubtypeExtraValue: string;
    isAuxiliary: boolean;
    overridesImplicitlyEnabledSubtype: boolean;
    isAsciiCapable: boolean;
}

export interface InputMethodSettings {
    defaultInputMethod: string;
    enabledInputMethods: string[];
    showImeWithHardKeyboard: boolean;
    showInputMethodPickerOnKeyguard: boolean;
    showInputMethodSelector: boolean;
    defaultInputMethodSelectorVisibility: boolean;
    inputMethodSwitchVisibility: boolean;
    inputMethodSwitcherVisibility: boolean;
    inputMethodSwitchNotificationShown: boolean;
    inputMethodSwitchDialogShown: boolean;
    lastInputMethodShown: boolean;
    showImeWithHardKeyboardEnabled: boolean;
    showImeWithHardKeyboardValue: boolean;
    showImeWithHardKeyboardDefault: boolean;
    showImeWithHardKeyboardSetBySettings: boolean;
    showImeWithHardKeyboardSetByUser: boolean;
    showImeWithHardKeyboardSetBySystem: boolean;
}

export interface InputMethodStats {
    method: string;
    time: number;
    count: number;
}

export interface InputEvent {
    eventTime: number;
    deviceId: number;
    source: number;
    action: number;
    flags: number;
    keyCode: number;
    scanCode: number;
    metaState: number;
    repeatCount: number;
    downTime: number;
    displayId: number;
    event: any;
}

export interface InputMethodLog {
    timestamp: string;
    type: 'switch' | 'subtype_change' | 'settings_change' | 'error';
    message: string;
    data?: any;
}

/**
 * Get all input methods
 */
export const getInputMethods = async (deviceId: string): Promise<InputMethodInfo[]> => {
    const response = await api.get(`/devices/${deviceId}/input-methods`);
    return response.data;
};

/**
 * Get current input method
 */
export const getCurrentInputMethod = async (deviceId: string): Promise<InputMethodInfo> => {
    const response = await api.get(`/devices/${deviceId}/input-methods/current`);
    return response.data;
};

/**
 * Set default input method
 */
export const setDefaultInputMethod = async (
    deviceId: string,
    inputMethodId: string
): Promise<void> => {
    await api.post(`/devices/${deviceId}/input-methods/default`, { inputMethodId });
};

/**
 * Enable/disable input method
 */
export const setInputMethodState = async (
    deviceId: string,
    inputMethodId: string,
    enabled: boolean
): Promise<void> => {
    await api.post(`/devices/${deviceId}/input-methods/${encodeURIComponent(inputMethodId)}/state`, {
        enabled,
    });
};

/**
 * Get input method settings
 */
export const getInputMethodSettings = async (
    deviceId: string
): Promise<InputMethodSettings> => {
    const response = await api.get(`/devices/${deviceId}/input-methods/settings`);
    return response.data;
};

/**
 * Update input method settings
 */
export const updateInputMethodSettings = async (
    deviceId: string,
    settings: Partial<InputMethodSettings>
): Promise<InputMethodSettings> => {
    const response = await api.patch(`/devices/${deviceId}/input-methods/settings`, settings);
    return response.data;
};

/**
 * Get input method statistics
 */
export const getInputMethodStats = async (
    deviceId: string,
    limit: number = 100
): Promise<InputMethodStats[]> => {
    const response = await api.get(`/devices/${deviceId}/input-methods/stats`, {
        params: { limit },
    });
    return response.data;
};

/**
 * Send input events
 */
export const sendInputEvents = async (
    deviceId: string,
    events: InputEvent[]
): Promise<void> => {
    await api.post(`/devices/${deviceId}/input-methods/events`, { events });
};

/**
 * Get input method logs
 */
export const getInputMethodLogs = async (
    deviceId: string,
    limit: number = 100
): Promise<InputMethodLog[]> => {
    const response = await api.get(`/devices/${deviceId}/input-methods/logs`, {
        params: { limit },
    });
    return response.data;
};

/**
 * Clear input method logs
 */
export const clearInputMethodLogs = async (deviceId: string): Promise<void> => {
    await api.delete(`/devices/${deviceId}/input-methods/logs`);
};

/**
 * Reset input method settings to defaults
 */
export const resetInputMethodSettings = async (deviceId: string): Promise<void> => {
    await api.post(`/devices/${deviceId}/input-methods/reset`);
};

/**
 * Get available input method subtypes
 */
export const getInputMethodSubtypes = async (
    deviceId: string,
    inputMethodId: string
): Promise<InputMethodSubtype[]> => {
    const response = await api.get(
        `/devices/${deviceId}/input-methods/${encodeURIComponent(inputMethodId)}/subtypes`
    );
    return response.data;
};

/**
 * Set input method subtype
 */
export const setInputMethodSubtype = async (
    deviceId: string,
    inputMethodId: string,
    subtypeId: string
): Promise<void> => {
    await api.post(
        `/devices/${deviceId}/input-methods/${encodeURIComponent(inputMethodId)}/subtype`,
        { subtypeId }
    );
};

/**
 * Get input method switcher visibility
 */
export const getInputMethodSwitcherVisibility = async (deviceId: string): Promise<boolean> => {
    const response = await api.get(`/devices/${deviceId}/input-methods/switcher-visible`);
    return response.data.visible;
};

/**
 * Show/hide input method switcher
 */
export const setInputMethodSwitcherVisibility = async (
    deviceId: string,
    visible: boolean
): Promise<void> => {
    await api.post(`/devices/${deviceId}/input-methods/switcher-visible`, { visible });
};

export default {
    // Input Methods
    getInputMethods,
    getCurrentInputMethod,
    setDefaultInputMethod,
    setInputMethodState,

    // Settings
    getInputMethodSettings,
    updateInputMethodSettings,
    resetInputMethodSettings,

    // Subtypes
    getInputMethodSubtypes,
    setInputMethodSubtype,

    // Stats & Logs
    getInputMethodStats,
    getInputMethodLogs,
    clearInputMethodLogs,

    // Input Events
    sendInputEvents,

    // Switcher
    getInputMethodSwitcherVisibility,
    setInputMethodSwitcherVisibility,
};