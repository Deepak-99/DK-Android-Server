import api from './api';

export interface DynamicConfig {
    id: string;
    key: string;
    value: any;
    type: string;
    description?: string;
}

/* ---------------- FETCH ---------------- */

export const getConfigurations = async (
    deviceId: string,
    scope: string
): Promise<DynamicConfig[]> => {

    const res = await api.get(
        `/devices/${deviceId}/config`,
        {
            params: { scope }
        }
    );

    return res.data.data;
};

/* ---------------- SAVE ---------------- */

export const saveConfiguration = async (
    deviceId: string,
    scope: string,
    config: Partial<DynamicConfig>
): Promise<DynamicConfig> => {

    const res = await api.post(
        `/devices/${deviceId}/config`,
        {
            scope,
            ...config
        }
    );

    return res.data.data;
};

/* ---------------- DELETE ---------------- */

export const deleteConfiguration = async (
    deviceId: string,
    scope: string,
    configId: string
): Promise<void> => {

    await api.delete(
        `/devices/${deviceId}/config/${configId}`,
        {
            params: { scope }
        }
    );
};
