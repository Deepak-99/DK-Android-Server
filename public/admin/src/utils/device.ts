export function normalizeDevice(d: any) {
    return {
        ...d,
        deviceId: d.deviceId || d.device_id || d.id,
        isOnline: d.isOnline ?? d.status === "online"
    };
}