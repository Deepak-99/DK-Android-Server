import api from "./apiBase";

export interface FileEntry {
    name: string;
    path: string;
    size: number;
    type: "file" | "dir";
    modified: number;
}

export const fileApi = {
    list(path: string) {
        return api.get<FileEntry[]>(`/files/ls?path=${encodeURIComponent(path)}`);
    },

    mkdir(path: string, name: string) {
        return api.post(`/files/mkdir`, { path, name });
    },

    delete(path: string) {
        return api.delete(`/files?path=${encodeURIComponent(path)}`);
    },

    upload(path: string, file: File) {
        const form = new FormData();
        form.append("path", path);
        form.append("file", file);
        return api.post(`/files/upload`, form, true); // true = form-data
    },

    download(path: string) {
        return api.get(`/files/download?path=${encodeURIComponent(path)}`, {
            responseType: "blob",
        });
    }
};
