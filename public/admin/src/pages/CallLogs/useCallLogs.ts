import { useEffect, useState } from "react";
import { callLogsApi } from "../../services/callLogsApi";
import { CallLog } from "./types";
import { onEvent } from "../../services/websocket";

export function useCallLogs(deviceId: string) {
  const [logs, setLogs] = useState<CallLog[]>([]);
  const [filtered, setFiltered] = useState<CallLog[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      setLoading(true);

      const res = await callLogsApi.list(deviceId);

      const data = res.data || [];

      setLogs(data);
      setFiltered(data);

    } finally {
      setLoading(false);
    }
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
          l.phone_number?.toLowerCase().includes(s) ||
          (l.name && l.name.toLowerCase().includes(s))
      );
    }

    if (params.type) {
      f = f.filter((l) => l.type === params.type);
    }

      const { minDuration, maxDuration } = params;

      if (minDuration !== undefined) {
          f = f.filter((l) => l.duration >= minDuration);
      }

      if (maxDuration !== undefined) {
          f = f.filter((l) => l.duration <= maxDuration);
      }

    setFiltered(f);
  }

  // ✅ Live websocket updates
  useEffect(() => {
    const unsubscribe = onEvent("calllogs.new", (payload: CallLog) => {
      if (payload.device_id === deviceId) {
        setLogs((prev) => [payload, ...prev]);
        setFiltered((prev) => [payload, ...prev]);
      }
    });

    return () => {
      unsubscribe?.();
    };
  }, [deviceId]);

  useEffect(() => {
    load();
  }, [deviceId]);

  return {
    logs,
    filtered,
    loading,
    applyFilters,
    reload: load,
  };
}
