// services/api/commands.ts
import axios from 'axios';
import { getAuthHeader } from './auth';

const API_BASE_URL = '/api/v1';

export const commandsApi = {
    getCommands: async (deviceId: string) => {
        const response = await axios.get(`${API_BASE_URL}/devices/${deviceId}/commands`, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    sendCommand: async (deviceId: string, command: { type: string; parameters: any }) => {
        const response = await axios.post(
            `${API_BASE_URL}/devices/${deviceId}/commands`,
            command,
            { headers: getAuthHeader() }
        );
        return response.data;
    },

    cancelCommand: async (deviceId: string, commandId: string) => {
        const response = await axios.post(
            `${API_BASE_URL}/devices/${deviceId}/commands/${commandId}/cancel`,
            {},
            { headers: getAuthHeader() }
        );
        return response.data;
    },

    deleteCommand: async (deviceId: string, commandId: string) => {
        const response = await axios.delete(
            `${API_BASE_URL}/devices/${deviceId}/commands/${commandId}`,
            { headers: getAuthHeader() }
        );
        return response.data;
    }
};