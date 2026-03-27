import api from "./api";
import { unwrap } from "@/utils/api";

export const contactsApi = {

  async list(deviceId: string) {
    const res = await api.get(`/contacts/${deviceId}`);
    return unwrap(res);
  },

  async get(id: string) {
    const res = await api.get(`/contacts/detail/${id}`);
    return unwrap(res);
  },

  async delete(id: string) {
    return api.delete(`/contacts/${id}`);
  }

};