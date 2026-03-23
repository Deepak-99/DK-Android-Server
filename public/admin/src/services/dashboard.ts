import api from "./api";

export const getDashboardStats = async () => {
    const res = await api.get("/dashboard/stats");

    const data = res.data?.data || {};

    return {
        devices: data.totalDevices ?? 0,
        online: data.activeDevices ?? 0,
        alerts: data.offlineDevices ?? 0,
        commands: data.totalCommands ?? 0,
    };
};

// NEW
export const getDashboardOverview = async () => {
    const res = await api.get("/dashboard/overview");
    return res.data?.data || {};
};