import api from "@/services/api";

export const commandApi = {
    list(deviceId: string) {
        return api.get(`/commands/device/${deviceId}`);
    },

    create(payload: {
        device_id: string;
        command_type: string;
        parameters?: Record<string, any>;
    }) {
        return api.post("/commands", payload);
    }
};
