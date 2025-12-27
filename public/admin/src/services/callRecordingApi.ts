import api from "./apiBase";
import { CallRecording } from "@/pages/CallRecordings/types";

export const callRecordingApi = {
    list(deviceId: string) {
        return api.get<CallRecording[]>(`/media/recordings/device/${deviceId}`);
    },

    delete(id: number) {
        return api.delete(`/media/recordings/${id}`);
    },

    // Used for downloading or streaming
    getFileUrl(file: string) {
        return `/media/recordings/${file}`;
    }
};
