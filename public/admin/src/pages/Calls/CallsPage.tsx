import { useState, useEffect } from "react";
import { useCalls } from "./useCalls";
import CallList from "./CallList";
import CallDetail from "./CallDetail";
import CallFilters from "./CallFilters";
import CallStats from "./CallStats";
import { callsApi } from "@/services/callsApi";

export default function CallsPage({ deviceId }: { deviceId: string }) {
    const { calls, loading, reload } = useCalls(deviceId);
    const [selected, setSelected] = useState<any>(null);
    const [stats, setStats] = useState<any>({});
    const [filtered, setFiltered] = useState(calls);

    useEffect(() => {
        setFiltered(calls);
    }, [calls]);

    useEffect(() => {
        callsApi.stats(deviceId).then(r => setStats(r.data));
    }, [deviceId]);

    function filter(type: string) {
        if (type === "all") setFiltered(calls);
        else setFiltered(calls.filter(c => c.type === type));
    }

    return (
        <div className="flex flex-col h-full">
            <CallStats stats={stats} />
            <CallFilters onFilter={filter} />

            <div className="flex flex-1">
                <CallList calls={filtered} onSelect={setSelected} />
                <CallDetail call={selected} />
            </div>
        </div>
    );
}
