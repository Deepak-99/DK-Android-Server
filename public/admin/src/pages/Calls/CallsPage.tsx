import { useState, useEffect } from "react";
import { useCalls } from "./useCalls";
import CallList from "./CallList";
import CallDetail from "./CallDetail";
import CallFilters from "./CallFilters";
import CallStats from "./CallStats";
import { callsApi } from "../../services/callsApi";

export default function CallsPage({ deviceId }: { deviceId: string }) {

  const { calls, loading, reload } = useCalls(deviceId);

  const [selected, setSelected] = useState<any>(null);
  const [stats, setStats] = useState<any>({});
  const [filtered, setFiltered] = useState(calls);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setFiltered(calls);
  }, [calls]);

  useEffect(() => {
    callsApi.stats(deviceId)
      .then((r: { data: any; }) => setStats(r.data))
      .catch(() => {
        setError("Failed to load call statistics");
      });
  }, [deviceId]);

  function filter(type: string) {
    if (type === "all") {
      setFiltered(calls);
    } else {
      setFiltered(calls.filter(c => c.type === type));
    }
  }

  if (loading) {
    return <div className="p-6">Loading calls...</div>;
  }

  return (
    <div className="flex flex-col h-full">

      <CallStats stats={stats} />
      <CallFilters onFilter={filter} />

      <div className="flex flex-1">
        <CallList calls={filtered} onSelect={setSelected} />
        <CallDetail call={selected} />
      </div>

      {error && (
        <div className="error-box text-red-500 p-2">
          {error}
        </div>
      )}

    </div>
  );
}
