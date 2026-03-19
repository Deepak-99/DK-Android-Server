import { useEffect, useState } from "react";
import { devicesApi } from "../../services/devicesApi";
import { subscribe } from "../../services/websocket";

interface DeviceHeartbeatPayload {
  deviceId: string;
  batteryLevel?: number;
  networkType?: string;
}

interface DeviceStatusPayload {
  deviceId: string;
  status: "online" | "offline";
}

export function useDeviceDetail(deviceId: string) {

  const numericId = Number(deviceId);

  const [info, setInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // -------------------------
  // Load static device info
  // -------------------------

  useEffect(() => {

    if (!numericId) return;

    let mounted = true;

    const load = async () => {
      try {
        setLoading(true);

        const res = await devicesApi.get(numericId);

        if (mounted) {
          setInfo(res.data);
        }

      } catch (err) {
        console.error("Device info load failed", err);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // call async function safely
    void load();

    return () => {
      mounted = false;
    };

  }, [numericId]);

  // -------------------------
  // WebSocket live updates
  // -------------------------

  useEffect(() => {

    const unsubscribe = subscribe((event: any) => {

      // Battery + heartbeat update
      if (event.type === "device_heartbeat") {

        const payload = event as DeviceHeartbeatPayload;

        if (payload.deviceId !== deviceId) return;

        setInfo((prev: any) => ({
          ...prev,
          battery: payload.batteryLevel,
          network: payload.networkType,
          isOnline: true,
          lastSeen: new Date().toISOString()
        }));
      }

      // Online / offline state
      if (event.type === "device_status") {

        const payload = event as DeviceStatusPayload;

        if (payload.deviceId !== deviceId) return;

        setInfo((prev: any) => ({
          ...prev,
          isOnline: payload.status === "online"
        }));
      }

    });

    return () => {
      unsubscribe();
    };

  }, [deviceId]);

  return { info, loading };
}
