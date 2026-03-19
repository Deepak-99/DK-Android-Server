import { useEffect, useState } from "react";
import { deviceLocationApi } from "../../../../services/deviceLocationApi";
import { subscribe } from "../../../../services/websocket";

interface LocationPayload {
  deviceId: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp?: string;
}

export function useLocationData(deviceId: string) {
  const [latest, setLatest] = useState<LocationPayload | null>(null);
  const [history, setHistory] = useState<LocationPayload[]>([]);
  const [loading, setLoading] = useState(true);

  // ---------------------------
  // Initial REST load
  // ---------------------------

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);

        const [latestRes, historyRes] = await Promise.all([
          deviceLocationApi.latest(deviceId),
          deviceLocationApi.history(deviceId, 200),
        ]);

        if (!mounted) return;

        setLatest(latestRes.data || null);
        setHistory(historyRes.data || []);
      } catch (err) {
        console.error("Location load failed", err);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    if (deviceId) {
      load();
    }

    return () => {
      mounted = false;
    };
  }, [deviceId]);

  // ---------------------------
  // Live WebSocket updates
  // ---------------------------

  useEffect(() => {
    if (!deviceId) return;

    const unsubscribe = subscribe((event) => {
      if (event?.type !== "location_update") return;

      const payload = event.payload as LocationPayload;

      if (!payload || payload.deviceId !== deviceId) return;

      setLatest(payload);
      setHistory((prev) => [payload, ...prev]);
    });

    return () => {
      unsubscribe();
    };
  }, [deviceId]);

  return {
    latest,
    history,
    loading,
  };
}
