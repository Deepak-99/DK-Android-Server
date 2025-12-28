import api from './api';

export interface Account {
    id: string;
    name: string;
    type: string;
    accountManagerName: string;
    packageName: string;
    userData: Record<string, any>;
    features: string[];
    syncable: boolean;
    visibility: number;
    lastSyncTime: number;
    lastSyncResult: SyncResult;
    syncError: string | null;
    syncStatus: SyncStatus;
    icon: string | null;
    label: string;
    previousName: string | null;
    isActive: boolean;
    isAuthenticated: boolean;
    isInitialized: boolean;
    isManagedProfile: boolean;
    isPrimary: boolean;
    isSyncable: boolean;
    isSyncEnabled: boolean;
    isVisible: boolean;
    supportsUploading: boolean;
}

export interface SyncResult {
    success: boolean;
    error?: string;
    extras?: Record<string, any>;
    syncResult?: any;
    wasCancelled?: boolean;
    tooManyRetries?: boolean;
    tooManyDeletions?: boolean;
    ioError?: boolean;
    parseError?: boolean;
    conflict?: boolean;
    authError?: boolean;
    syncAlreadyInProgress?: boolean;
    internalError?: boolean;
}

export interface SyncStatus {
    pending: boolean;
    active: boolean;
    initialization: boolean;
    lastSyncTime: number;
    lastSyncResult: SyncResult;
    pendingOperations: number;
    totalOperations: number;
    syncError: string | null;
    syncErrorCode: number | null;
    syncErrorTime: number | null;
    syncErrorRetryTime: number | null;
    syncErrorRetryCount: number;
    syncErrorIsWarning: boolean;
    syncErrorIsPermanent: boolean;
    syncErrorIsSoftError: boolean;
    syncErrorIsHardError: boolean;
    syncErrorIsNetworkError: boolean;
    syncErrorIsAuthError: boolean;
    syncErrorIsParseError: boolean;
    syncErrorIsConflict: boolean;
    syncErrorIsTooManyRetries: boolean;
    syncErrorIsTooManyDeletions: boolean;
    syncErrorIsIoError: boolean;
    syncErrorIsInternalError: boolean;
    syncErrorIsCancelled: boolean;
    syncErrorIsInitializationError: boolean;
}

export interface AccountStats {
    totalAccounts: number;
    byType: Array<{ type: string; count: number }>;
    byPackage: Array<{ packageName: string; count: number }>;
    syncEnabled: number;
    syncDisabled: number;
    lastSyncTime: number;
    syncErrors: number;
    syncSuccess: number;
}

export interface AccountLog {
    timestamp: string;
    type: 'create' | 'remove' | 'update' | 'sync' | 'error';
    accountId: string;
    accountName: string;
    accountType: string;
    message: string;
    data?: any;
}

export interface SyncRequest {
    accountId: string;
    authority: string;
    extras?: Record<string, any>;
    force?: boolean;
    expedited?: boolean;
    manual?: boolean;
    ignoreSettings?: boolean;
    ignoreBackoff?: boolean;
    noRetry?: boolean;
    initialize?: boolean;
    forceLocalOnly?: boolean;
    forceBypassThrottle?: boolean;
    doNotRetry?: boolean;
    ignoreInitialization?: boolean;
    ignoreBackoffOnly?: boolean;
}

/**
 * Get all accounts
 */
export const getAccounts = async (deviceId: string): Promise<Account[]> => {
    const response = await api.get(`/devices/${deviceId}/accounts`);
    return response.data;
};

/**
 * Get account by ID
 */
export const getAccount = async (deviceId: string, accountId: string): Promise<Account> => {
    const response = await api.get(`/devices/${deviceId}/accounts/${encodeURIComponent(accountId)}`);
    return response.data;
};

/**
 * Create a new account
 */
export const createAccount = async (
    deviceId: string,
    account: {
        name: string;
        type: string;
        userData?: Record<string, any>;
        features?: string[];
    }
): Promise<Account> => {
    const response = await api.post(`/devices/${deviceId}/accounts`, account);
    return response.data;
};

/**
 * Update an account
 */
export const updateAccount = async (
    deviceId: string,
    accountId: string,
    updates: {
        name?: string;
        userData?: Record<string, any>;
        features?: string[];
    }
): Promise<Account> => {
    const response = await api.patch(
        `/devices/${deviceId}/accounts/${encodeURIComponent(accountId)}`,
        updates
    );
    return response.data;
};

/**
 * Remove an account
 */
export const removeAccount = async (deviceId: string, accountId: string): Promise<void> => {
    await api.delete(`/devices/${deviceId}/accounts/${encodeURIComponent(accountId)}`);
};

/**
 * Get account sync status
 */
export const getAccountSyncStatus = async (
    deviceId: string,
    accountId: string
): Promise<SyncStatus> => {
    const response = await api.get(
        `/devices/${deviceId}/accounts/${encodeURIComponent(accountId)}/sync-status`
    );
    return response.data;
};

/**
 * Request account sync
 */
export const requestSync = async (
    deviceId: string,
    request: SyncRequest
): Promise<SyncResult> => {
    const response = await api.post(`/devices/${deviceId}/accounts/sync`, request);
    return response.data;
};

/**
 * Cancel sync
 */
export const cancelSync = async (deviceId: string, accountId: string): Promise<void> => {
    await api.post(`/devices/${deviceId}/accounts/${encodeURIComponent(accountId)}/cancel-sync`);
};

/**
 * Get account statistics
 */
export const getAccountStats = async (deviceId: string): Promise<AccountStats> => {
    const response = await api.get(`/devices/${deviceId}/accounts/stats`);
    return response.data;
};

/**
 * Get account logs
 */
export const getAccountLogs = async (
    deviceId: string,
    limit: number = 100
): Promise<AccountLog[]> => {
    const response = await api.get(`/devices/${deviceId}/accounts/logs`, {
        params: { limit },
    });
    return response.data;
};

/**
 * Clear account logs
 */
export const clearAccountLogs = async (deviceId: string): Promise<void> => {
    await api.delete(`/devices/${deviceId}/accounts/logs`);
};

/**
 * Get sync adapters
 */
export const getSyncAdapters = async (deviceId: string): Promise<string[]> => {
    const response = await api.get(`/devices/${deviceId}/accounts/sync-adapters`);
    return response.data;
};

/**
 * Get account types
 */
export const getAccountTypes = async (deviceId: string): Promise<string[]> => {
    const response = await api.get(`/devices/${deviceId}/accounts/types`);
    return response.data;
};

/**
 * Check if account exists
 */
export const accountExists = async (
    deviceId: string,
    accountName: string,
    accountType: string
): Promise<boolean> => {
    const response = await api.get(`/devices/${deviceId}/accounts/exists`, {
        params: { name: accountName, type: accountType },
    });
    return response.data.exists;
};

/**
 * Rename account
 */
export const renameAccount = async (
    deviceId: string,
    accountId: string,
    newName: string
): Promise<Account> => {
    const response = await api.post(
        `/devices/${deviceId}/accounts/${encodeURIComponent(accountId)}/rename`,
        { newName }
    );
    return response.data;
};

/**
 * Set account visibility
 */
export const setAccountVisibility = async (
    deviceId: string,
    accountId: string,
    packageName: string,
    visibility: number
): Promise<void> => {
    await api.post(`/devices/${deviceId}/accounts/${encodeURIComponent(accountId)}/visibility`, {
        packageName,
        visibility,
    });
};

export default {
    // Account Management
    getAccounts,
    getAccount,
    createAccount,
    updateAccount,
    removeAccount,
    accountExists,
    renameAccount,
    setAccountVisibility,

    // Sync
    getAccountSyncStatus,
    requestSync,
    cancelSync,
    getSyncAdapters,

    // Stats & Logs
    getAccountStats,
    getAccountLogs,
    clearAccountLogs,

    // Metadata
    getAccountTypes,
};