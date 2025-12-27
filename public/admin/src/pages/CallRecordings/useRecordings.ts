import { useEffect, useState } from "react";
import { recordingsApi } from "@/services/recordingsApi";
import { CallRecording } from "./types";
import { useWebSocket } from "@/hooks/useWebSocket";

export function useRecordings(deviceId: string) {
  const [items, setItems] = useState<CallRecording[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await recordingsApi.list(deviceId);
    setItems(res.data || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [deviceId]);

  useWebSocket("call.recording.new", (rec: CallRecording) => {
    if (rec.device_id === deviceId) {
      setItems(prev => [rec, ...prev]);
    }
  });

  useWebSocket("call.recording.deleted", ({ id }) => {
    setItems(prev => prev.filter(r => r.id !== id));
  });

  return { items, loading, reload: load };
}
