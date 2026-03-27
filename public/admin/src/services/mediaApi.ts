import api from "./api";
import { unwrap } from "@/utils/api";

export const mediaApi = {

    async list(deviceId: string) {
        const res = await api.get(`/media/${deviceId}`);
        return unwrap(res);
    },

    async download(id: string) {
        return api.get(`/media/download/${id}`, {
            responseType: "blob"
        });
    }

};