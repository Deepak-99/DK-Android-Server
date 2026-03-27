import api from "./api";
import { unwrap } from "@/utils/api";

export const fileExplorerApi = {

  async list(deviceId: string, path = "/") {
    const res = await api.get(`/fileExplorer/${deviceId}`, {
      params: { path }
    });
    return unwrap(res);
  },

  async download(deviceId: string, file: string) {
    return api.get(`/files/download`, {
      params: { deviceId, file },
      responseType: "blob"
    });
  },

  async upload(deviceId: string, file: File, path = "/") {
    const form = new FormData();
    form.append("file", file);
    form.append("path", path);

    return api.post(`/files/upload/${deviceId}`, form);
  }

};