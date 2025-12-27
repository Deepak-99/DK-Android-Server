import api from "@/services/api";

export const screenRecordingApi = {
  list(deviceId: string) {
    return api.get(
      `/files/ls?path=/recordings/${deviceId}`
    );
  },

  stream(path: string) {
    return `/files/download?path=${encodeURIComponent(path)}`;
  },

  delete(path: string) {
    return api.post("/files/delete", { path });
  }
};
