import api from "./apiBase";

export const deviceLocationApi = {
    latest(deviceId: string) {
        return api.get(`/location/device/${deviceId}/latest`);
    },

    history(deviceId: string, limit = 200) {
        return api.get(`/location/device/${deviceId}?limit=${limit}`);
    },

    bulk(deviceId: string, since: number) {
        return api.get(`/location/device/${deviceId}?since=${since}`);
    }
};
