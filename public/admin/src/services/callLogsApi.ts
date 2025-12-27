import api from "./apiBase";
import { CallLog } from "@/pages/CallLogs/types";

export const callLogsApi = {
    list(deviceId: string, limit = 100) {
        return api.get<CallLog[]>(`/calls/device/${deviceId}?limit=${limit}`);
    },

    stats(deviceId: string) {
        return api.get(`/calls/stats/device/${deviceId}`);
    }
};
