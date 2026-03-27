import api from "./api";
import { unwrap } from "@/utils/api";

export const commandsApi = {

  async send(deviceId: string, command: string) {
    const res = await api.post("/commands", {
      deviceId,
      command
    });

    return unwrap(res);
  },

  async history(deviceId: string) {
    const res = await api.get(`/commands?deviceId=${deviceId}`);
    return unwrap(res);
  }
};