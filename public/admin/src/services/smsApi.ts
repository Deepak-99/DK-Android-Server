import api from "@/services/apiBase";
import { SMSMessage } from "./types";

export const smsApi = {
  list(deviceId: string, limit = 50) {
    return api.get<SMSMessage[]>(`/sms/device/${deviceId}?limit=${limit}`);
  },

    threads(deviceId: string) {
        return api.get<SMSThread[]>(`/sms/device/${deviceId}/conversations`);
    },

  conversations(deviceId: string) {
    return api.get(`/sms/device/${deviceId}/conversations`);
  },

    messages(deviceId: string, threadId: string) {
        return api.get<SMSMessage[]>(
            `/sms/device/${deviceId}?thread_id=${threadId}`
        );
    },

  search(query: string) {
    return api.get<SMSMessage[]>(`/sms/search/${query}`);
  },

  stats(deviceId: string) {
    return api.get(`/sms/stats/device/${deviceId}`);
  },

    deleteMessage(id: number) {
        return api.delete(`/sms/${id}`);
    },

  delete(id: number) {
    return api.delete(`/sms/${id}`);
  },

  send(deviceId: string, to: string, body: string) {
    return api.post(`/commands`, {
      device_id: deviceId,
      command_type: "SEND_SMS",
      parameters: { to, body }
    });
  }
};
