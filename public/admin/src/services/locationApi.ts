import api from "@/services/apiBase";
import { LocationPoint } from "@/pages/Location/types";

export const locationApi = {
    history(deviceId: string, limit = 500) {
        return api.get<LocationPoint[]>(
            `/location/device/${deviceId}?limit=${limit}`
        );
    },

    latest(deviceId: string) {
        return api.get<LocationPoint>(
            `/location/device/${deviceId}/latest`
        );
    }
};
