import { useEffect, useState } from "react";
import { deviceInfoApi } from "@/services/deviceInfoApi";
import { ws } from "@/services/ws";

export function useDeviceDetail(deviceId: string) {
    const [info, setInfo] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // fetch static info
    useEffect(() => {
        async function load() {
            setLoading(true);
            const res = await deviceInfoApi.get(deviceId);
            setInfo(res.data);
            setLoading(false);
        }
        load();
    }, [deviceId]);

    // WebSocket live updates
    useEffect(() => {
        ws.join(`device:${deviceId}`);

        ws.subscribe("device_heartbeat", (payload) => {
            if (payload.deviceId === deviceId) {
                setInfo((prev: any) => ({
                    ...prev,
                    battery: payload.batteryLevel,
                    network: payload.networkType,
                    isOnline: true,
                    lastSeen: new Date().toISOString(),
                }));
            }
        });

        ws.subscribe("device_status", (payload) => {
            if (payload.deviceId === deviceId) {
                setInfo((prev: any) => ({
                    ...prev,
                    isOnline: payload.status === "online",
                }));
            }
        });

        return () => ws.leave(`device:${deviceId}`);
    }, [deviceId]);

    return { info, loading };
}
