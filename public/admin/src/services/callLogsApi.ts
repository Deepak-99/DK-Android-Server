import api from "./api";
import { unwrap } from "@/utils/api";

export const callLogsApi = {

  async list(deviceId: string) {
    const res = await api.get(`/callLogs/${deviceId}`);
    return unwrap(res);
  },

  async detail(id: string) {
    const res = await api.get(`/callLogs/detail/${id}`);
    return unwrap(res);
  }

};