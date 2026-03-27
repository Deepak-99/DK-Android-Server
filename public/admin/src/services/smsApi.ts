import api from "./api";
import { unwrap } from "@/utils/api";

export const smsApi = {

  async list(deviceId: string) {
    const res = await api.get(`/sms/${deviceId}`);
    return unwrap(res);
  },

  async thread(deviceId: string, number: string) {
    const res = await api.get(`/sms/${deviceId}/thread`, {
      params: { number }
    });
    return unwrap(res);
  },

  async send(deviceId: string, number: string, message: string) {
    return api.post("/sms/send", {
      deviceId,
      number,
      message
    });
  }

};