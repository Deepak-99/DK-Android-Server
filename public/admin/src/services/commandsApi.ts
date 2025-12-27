import api from "./apiBase";
import { CommandDTO, CommandType } from "@/types/commands";
import { CommandItem } from "@/pages/Commands/types";

export const commandsApi = {
    list(deviceId: string) {
        return api.get<CommandItem[]>(`/commands?device_id=${deviceId}`);
    },

    create(deviceId: string, command_type: string, parameters: any = {}) {
        return api.post<CommandItem>("/commands", {
            device_id: deviceId,
            command_type,
            parameters
        });
    },

    updateStatus(id: number, status: string, result?: any) {
        return api.patch(`/commands/${id}/status`, { status, result });
    }
};
