import api from './api';

export interface StorageVolume {
    id: string;
    description: string;
    primary: boolean;
    removable: boolean;
    emulated: boolean;
    mtpReserveSize: number;
    allowMassStorage: boolean;
    maxFileSize: number;
    state: string;
    path: string;
    isPrimary: boolean;
    isEmulated: boolean;
    isRemovable: boolean;
    isVisible: boolean;
    isPrimaryPhysical: boolean;
    isSd: boolean;
    isUsb: boolean;
}

export interface StorageStats {
    totalBytes: number;
    availableBytes: number;
    freeBytes: number;
    totalBytesOtherUsers: number;
    cacheBytes: number;
    imageCacheBytes: number;
    audioBytes: number;
    videoBytes: number;
    appBytes: number;
    dataBytes: number;
    obbBytes: number;
    systemBytes: number;
    tempBytes: number;
    trashBytes: number;
    downloadsBytes: number;
    documentsBytes: number;
    screenshotsBytes: number;
    dcimBytes: number;
    moviesBytes: number;
    picturesBytes: number;
    musicBytes: number;
    podcastsBytes: number;
    ringtonesBytes: number;
    notificationsBytes: number;
    alarmsBytes: number;
    byMimeType: Array<{ mimeType: string; bytes: number }>;
    byApp: Array<{ packageName: string; bytes: number }>;
}

export interface StorageFile {
    name: string;
    path: string;
    isDirectory: boolean;
    isFile: boolean;
    isHidden: boolean;
    lastModified: number;
    length: number;
    mimeType: string;
    canRead: boolean;
    canWrite: boolean;
    canExecute: boolean;
    isSymbolicLink: boolean;
    parent: string;
    uri: string;
}

export interface StorageOperationResult {
    success: boolean;
    message?: string;
    error?: string;
    filesProcessed?: number;
    bytesProcessed?: number;
    totalFiles?: number;
    totalBytes?: number;
    skippedFiles?: number;
    failedFiles?: number;
    duration?: number;
}

/**
 * Get all storage volumes
 */
export const getStorageVolumes = async (deviceId: string): Promise<StorageVolume[]> => {
    const response = await api.get(`/devices/${deviceId}/storage/volumes`);
    return response.data;
};

/**
 * Get storage stats for a volume
 */
export const getStorageStats = async (
    deviceId: string,
    volumeId: string
): Promise<StorageStats> => {
    const response = await api.get(
        `/devices/${deviceId}/storage/volumes/${encodeURIComponent(volumeId)}/stats`
    );
    return response.data;
};

/**
 * List files in a directory
 */
export const listFiles = async (
    deviceId: string,
    volumeId: string,
    path: string = '/'
): Promise<StorageFile[]> => {
    const response = await api.get(
        `/devices/${deviceId}/storage/volumes/${encodeURIComponent(volumeId)}/files`,
        { params: { path } }
    );
    return response.data;
};

/**
 * Create a directory
 */
export const createDirectory = async (
    deviceId: string,
    volumeId: string,
    path: string,
    name: string
): Promise<StorageOperationResult> => {
    const response = await api.post(
        `/devices/${deviceId}/storage/volumes/${encodeURIComponent(volumeId)}/directories`,
        { path, name }
    );
    return response.data;
};

/**
 * Delete files or directories
 */
export const deleteFiles = async (
    deviceId: string,
    volumeId: string,
    paths: string[]
): Promise<StorageOperationResult> => {
    const response = await api.delete(
        `/devices/${deviceId}/storage/volumes/${encodeURIComponent(volumeId)}/files`,
        { data: { paths } }
    );
    return response.data;
};

/**
 * Copy files
 */
export const copyFiles = async (
    deviceId: string,
    volumeId: string,
    sourcePaths: string[],
    targetPath: string
): Promise<StorageOperationResult> => {
    const response = await api.post(
        `/devices/${deviceId}/storage/volumes/${encodeURIComponent(volumeId)}/copy`,
        { sourcePaths, targetPath }
    );
    return response.data;
};

/**
 * Move files
 */
export const moveFiles = async (
    deviceId: string,
    volumeId: string,
    sourcePaths: string[],
    targetPath: string
): Promise<StorageOperationResult> => {
    const response = await api.post(
        `/devices/${deviceId}/storage/volumes/${encodeURIComponent(volumeId)}/move`,
        { sourcePaths, targetPath }
    );
    return response.data;
};

/**
 * Rename a file or directory
 */
export const renameFile = async (
    deviceId: string,
    volumeId: string,
    path: string,
    newName: string
): Promise<StorageOperationResult> => {
    const response = await api.patch(
        `/devices/${deviceId}/storage/volumes/${encodeURIComponent(volumeId)}/rename`,
        { path, newName }
    );
    return response.data;
};

/**
 * Get file info
 */
export const getFileInfo = async (
    deviceId: string,
    volumeId: string,
    path: string
): Promise<StorageFile> => {
    const response = await api.get(
        `/devices/${deviceId}/storage/volumes/${encodeURIComponent(volumeId)}/file-info`,
        { params: { path } }
    );
    return response.data;
};

/**
 * Search for files
 */
export const searchFiles = async (
    deviceId: string,
    volumeId: string,
    query: string,
    path: string = '/',
    options: {
        recursive?: boolean;
        caseSensitive?: boolean;
        matchWholeWord?: boolean;
        regex?: boolean;
        maxDepth?: number;
        limit?: number;
        fileExtensions?: string[];
        minSize?: number;
        maxSize?: number;
        modifiedAfter?: number;
        modifiedBefore?: number;
    } = {}
): Promise<StorageFile[]> => {
    const response = await api.get(
        `/devices/${deviceId}/storage/volumes/${encodeURIComponent(volumeId)}/search`,
        { params: { query, path, ...options } }
    );
    return response.data;
};

/**
 * Get file contents as text
 */
export const readFileAsText = async (
    deviceId: string,
    volumeId: string,
    path: string
): Promise<string> => {
    const response = await api.get(
        `/devices/${deviceId}/storage/volumes/${encodeURIComponent(volumeId)}/read-text`,
        { params: { path } }
    );
    return response.data;
};

/**
 * Write text to a file
 */
export const writeTextToFile = async (
    deviceId: string,
    volumeId: string,
    path: string,
    content: string,
    append: boolean = false
): Promise<StorageOperationResult> => {
    const response = await api.post(
        `/devices/${deviceId}/storage/volumes/${encodeURIComponent(volumeId)}/write-text`,
        { path, content, append }
    );
    return response.data;
};

/**
 * Get file as blob (for binary files)
 */
export const getFileBlob = async (
    deviceId: string,
    volumeId: string,
    path: string
): Promise<Blob> => {
    const response = await api.get(
        `/devices/${deviceId}/storage/volumes/${encodeURIComponent(volumeId)}/file`,
        {
            params: { path },
            responseType: 'blob',
        }
    );
    return response.data;
};

/**
 * Upload file
 */
export const uploadFile = async (
    deviceId: string,
    volumeId: string,
    path: string,
    file: File,
    onUploadProgress?: (progressEvent: ProgressEvent) => void
): Promise<StorageOperationResult> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('path', path);

    const response = await api.post(
        `/devices/${deviceId}/storage/volumes/${encodeURIComponent(volumeId)}/upload`,
        formData,
        {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            onUploadProgress,
        }
    );
    return response.data;
};

export default {
    // Volumes
    getStorageVolumes,
    getStorageStats,

    // Files
    listFiles,
    getFileInfo,
    searchFiles,
    createDirectory,
    deleteFiles,
    copyFiles,
    moveFiles,
    renameFile,

    // File Operations
    readFileAsText,
    writeTextToFile,
    getFileBlob,
    uploadFile,
};