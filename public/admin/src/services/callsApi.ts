import api from "@/services/apiBase";
import { CallLog } from "@/pages/Calls/types";

export const callsApi = {
    list(deviceId: string) {
        return api.get<CallLog[]>(`/calls/device/${deviceId}`);
    },

    search(query: string) {
        return api.get<CallLog[]>(`/calls/search/${query}`);
    },

    stats(deviceId: string) {
        return api.get(`/calls/stats/device/${deviceId}`);
    },

    delete(id: number) {
        return api.delete(`/calls/${id}`);
    },

    recording(id: number) {
        return `/calls/recording/${id}`;
    }
};
