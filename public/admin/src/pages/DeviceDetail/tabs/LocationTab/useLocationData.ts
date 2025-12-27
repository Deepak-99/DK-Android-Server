import { useEffect, useState } from "react";
import { deviceLocationApi } from "@/services/deviceLocationApi";
import { ws } from "@/services/ws";

export function useLocationData(deviceId: string) {
    const [latest, setLatest] = useState<any>(null);
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            setLoading(true);
            const [latestRes, historyRes] = await Promise.all([
                deviceLocationApi.latest(deviceId),
                deviceLocationApi.history(deviceId, 200)
            ]);
            setLatest(latestRes.data);
            setHistory(historyRes.data || []);
            setLoading(false);
        }
        load();
    }, [deviceId]);

    // 🔥 Live WebSocket location updates
    useEffect(() => {
        ws.join(`device:${deviceId}`);

        const unsub = ws.subscribe("location_update", (payload) => {
            if (payload.deviceId !== deviceId) return;
            setLatest(payload);
            setHistory((prev) => [...prev, payload]);
        });

        return () => {
            unsub();
            ws.leave(`device:${deviceId}`);
        };
    }, [deviceId]);

    return { latest, history, loading };
}
