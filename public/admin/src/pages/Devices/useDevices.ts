import { useEffect, useState, useCallback } from "react";
import { devicesApi } from "@/services/devicesApi";
import { useWSDeviceStore } from "@/store/wsDeviceStore";
import { subscribe } from "@/services/websocket";

export function useDevices() {
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const liveStatus = useWSDeviceStore(s => s.liveStatus);
  const updateStatus = useWSDeviceStore(s => s.updateStatus);

  const loadDevices = useCallback(async () => {
    try {
      setLoading(true);

      const res = await devicesApi.list();

      // IMPORTANT FIX
      const list = res?.data || res?.devices || res || [];

      setDevices(Array.isArray(list) ? list : []);

    } catch (e) {
      console.error("Device load failed", e);
      setDevices([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDevices();
  }, [loadDevices]);

  useEffect(() => {
    const unsub = subscribe((event) => {
      if (event?.type === "device_status") {
        updateStatus(event.payload.deviceId, event.payload.status);
      }
    });

    return () => unsub?.();
  }, []);

  return {
    loading,
    refresh: loadDevices,
    devices: devices.map(d => ({
      ...d,
      status: liveStatus[d.deviceId] || d.status
    }))
  };
}