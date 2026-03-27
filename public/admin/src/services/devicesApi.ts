import api from "./api";
import { unwrap } from "@/utils/api";
import { normalizeDevice } from "@/utils/device";

export const devicesApi = {
  async list() {
    const res = await api.get("/devices");
    return unwrap(res).map(normalizeDevice);
  },

  async get(id: string) {
    const res = await api.get(`/devices/${id}`);
    return normalizeDevice(unwrap(res));
  },

  async metrics(id: string) {
    const res = await api.get(`/devices/${id}/metrics`);
    return unwrap(res);
  },

  async location(id: string) {
    const res = await api.get(`/location/${id}`);
    return unwrap(res);
  }
};