import { useEffect, useState } from "react";
import { devicesApi, Device } from "@/services/devicesApi";
import { useWSDeviceStore } from "@/store/wsDeviceStore";
import { ws } from "@/services/ws";

export function useDevices() {
    const [loading, setLoading] = useState(true);
    const [devices, setDevices] = useState<Device[]>([]);
    const liveStatus = useWSDeviceStore((s) => s.liveStatus);
    const updateStatus = useWSDeviceStore((s) => s.updateStatus);

    useEffect(() => {
        async function load() {
            setLoading(true);
            const res = await devicesApi.list();
            setDevices(res.data.devices);
            setLoading(false);
        }
        load();
    }, []);

    // WebSocket live updates
    useEffect(() => {
        ws.subscribe("device_status", (payload: any) => {
            updateStatus(payload.deviceId, payload.status);
        });
    }, []);

    return {
        loading,
        devices: devices.map((d) => ({
            ...d,
            live: liveStatus[d.deviceId] ?? d.status,
        })),
    };
}
