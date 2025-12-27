import { useEffect, useState } from "react";
import { callsApi } from "@/services/callsApi";
import { CallLog } from "./types";
import { useWebSocket } from "@/hooks/useWebSocket";

export function useCalls(deviceId: string) {
    const [calls, setCalls] = useState<CallLog[]>([]);
    const [loading, setLoading] = useState(true);

    async function load() {
        setLoading(true);
        const res = await callsApi.list(deviceId);
        setCalls(res.data || []);
        setLoading(false);
    }

    useEffect(() => { load(); }, [deviceId]);

    useWebSocket("call.new", (call: CallLog) => {
        if (call.device_id === deviceId) {
            setCalls(prev => [call, ...prev]);
        }
    });

    useWebSocket("call.delete", ({ id }: { id: number }) => {
        setCalls(prev => prev.filter(c => c.id !== id));
    });

    return { calls, loading, reload: load };
}
