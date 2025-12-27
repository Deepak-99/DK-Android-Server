import { useEffect, useState } from "react";
import { locationApi } from "@/services/locationApi";
import { LocationPoint } from "./types";
import { useWebSocket } from "@/hooks/useWebSocket";

export function useLocation(deviceId: string) {
    const [points, setPoints] = useState<LocationPoint[]>([]);
    const [live, setLive] = useState<LocationPoint | null>(null);

    async function loadHistory() {
        const res = await locationApi.history(deviceId);
        setPoints(res.data || []);
    }

    async function loadLatest() {
        const res = await locationApi.latest(deviceId);
        setLive(res.data);
    }

    useEffect(() => {
        loadHistory();
        loadLatest();
    }, [deviceId]);

    useWebSocket("location.update", (loc: LocationPoint) => {
        if (loc.device_id !== deviceId) return;
        setLive(loc);
        setPoints(p => [...p.slice(-999), loc]); // keep last 1000
    });

    return { points, live };
}
