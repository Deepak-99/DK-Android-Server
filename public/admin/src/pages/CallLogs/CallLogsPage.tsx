import { useState } from "react";
import CallLogFilters from "./CallLogFilters";
import CallLogList from "./CallLogList";
import CallLogDetails from "./CallLogDetails";
import { useCallLogs } from "./useCallLogs";
import { CallLog } from "./types";

export default function CallLogsPage({ deviceId }: { deviceId: string }) {
  const { filtered, applyFilters, loading } = useCallLogs(deviceId);

  const [selected, setSelected] = useState<CallLog | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (loading) {
    return <div className="p-6">Loading call logs…</div>;
  }

  return (
    <div className="flex h-full">
      <div className="flex flex-col h-full">
        <CallLogFilters
          onFilter={(filters) => {
            try {
              applyFilters(filters);
            } catch (err) {
              setError("Failed to apply filters");
            }
          }}
        />

        <CallLogList
          logs={filtered}
          onSelect={setSelected}
        />
      </div>

      <CallLogDetails log={selected} />

      {error && (
        <div className="error-box p-3 text-red-600">
          {error}
        </div>
      )}
    </div>
  );
}
