import api from "./api";

export interface FileItem {
    name: string;
    path: string;
    type: 'file' | 'directory';
    size?: number;
    modified: string;
    permissions: string;
    extension?: string;
    mimeType?: string;
}

export interface DirectoryContents {
    path: string;
    files: FileItem[];
    parentPath: string | null;
    storageInfo: {
        totalSpace: number;
        freeSpace: number;
        usedSpace: number;
    };
}

export const getDirectoryContents = async (
    deviceId: string,
    path: string
): Promise<DirectoryContents> => {
    const response = await api.get(`/devices/${deviceId}/files`, {
        params: { path }
    });
    return response.data;
};

export const createDirectory = async (
    deviceId: string,
    path: string
): Promise<void> => {
    await api.post(`/devices/${deviceId}/files/directories`, { path });
};

export const uploadFile = async (
    deviceId: string,
    path: string,
    file: File
): Promise<void> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('path', path);

    await api.post(`/devices/${deviceId}/files/upload`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
};

export const downloadFile = async (
    deviceId: string,
    filePath: string
): Promise<Blob> => {
    const response = await api.get(`/devices/${deviceId}/files/download`, {
        params: { path: filePath },
        responseType: 'blob',
    });
    return response.data;
};

export const deleteFile = async (
    deviceId: string,
    path: string
): Promise<void> => {
    await api.delete(`/devices/${deviceId}/files`, { data: { path } });
};

export const renameFile = async (
    deviceId: string,
    oldPath: string,
    newName: string
): Promise<void> => {
    await api.patch(`/devices/${deviceId}/files/rename`, {
        oldPath,
        newName,
    });
};

export const copyFile = async (
    deviceId: string,
    sourcePath: string,
    destinationPath: string
): Promise<void> => {
    await api.post(`/devices/${deviceId}/files/copy`, {
        sourcePath,
        destinationPath,
    });
};

export const moveFile = async (
    deviceId: string,
    sourcePath: string,
    destinationPath: string
): Promise<void> => {
    await api.post(`/devices/${deviceId}/files/move`, {
        sourcePath,
        destinationPath,
    });
};

export const getFileInfo = async (
    deviceId: string,
    path: string
): Promise<FileItem> => {
    const response = await api.get(`/devices/${deviceId}/files/info`, {
        params: { path },
    });
    return response.data;
};

export const searchFiles = async (
    deviceId: string,
    query: string,
    path: string = '/'
): Promise<FileItem[]> => {
    const response = await api.get(`/devices/${deviceId}/files/search`, {
        params: { query, path },
    });
    return response.data;
};