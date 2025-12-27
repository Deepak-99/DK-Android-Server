import api from "@/services/apiBase";
import { CallRecording } from "@/pages/CallRecordings/types";

export const recordingsApi = {
    list(deviceId: string) {
        return api.get<CallRecording[]>(`/calls/recordings/device/${deviceId}`);
    },

    stats(deviceId: string) {
        return api.get(`/calls/recordings/stats/device/${deviceId}`);
    },

    stream(id: number) {
        return `/calls/recording/${id}`;
    },

    delete(id: number) {
        return api.delete(`/calls/recording/${id}`);
    }
};
