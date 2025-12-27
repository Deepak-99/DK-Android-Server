import { useEffect, useState } from "react";
import { callLogsApi } from "@/services/callLogsApi";
import { CallLog } from "./types";
import { useWebSocket } from "@/hooks/useWebSocket";

export function useCallLogs(deviceId: string) {
    const [logs, setLogs] = useState<CallLog[]>([]);
    const [filtered, setFiltered] = useState<CallLog[]>([]);
    const [loading, setLoading] = useState(true);

    async function load() {
        setLoading(true);
        const res = await callLogsApi.list(deviceId);
        setLogs(res.data || []);
        setFiltered(res.data || []);
        setLoading(false);
    }

    function applyFilters(params: {
        type?: string;
        search?: string;
        minDuration?: number;
        maxDuration?: number;
    }) {
        let f = [...logs];

        if (params.search) {
            const s = params.search.toLowerCase();
            f = f.filter(
                (l) =>
                    l.phone_number.includes(s) ||
                    (l.name && l.name.toLowerCase().includes(s))
            );
        }

        if (params.type) f = f.filter((l) => l.type === params.type);
        if (params.minDuration) f = f.filter((l) => l.duration >= params.minDuration);
        if (params.maxDuration) f = f.filter((l) => l.duration <= params.maxDuration);

        setFiltered(f);
    }

    // WebSocket live updates
    useWebSocket("calllogs.new", (payload: CallLog) => {
        if (payload.device_id === deviceId) {
            setLogs((prev) => [payload, ...prev]);
            setFiltered((prev) => [payload, ...prev]);
        }
    });

    useEffect(() => {
        load();
    }, []);

    return { logs, filtered, loading, applyFilters, reload: load };
}
