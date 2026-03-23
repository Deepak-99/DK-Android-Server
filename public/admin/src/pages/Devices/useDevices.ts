import { useEffect, useState } from "react";
import { devicesApi, Device } from "@/services/devicesApi";
import { useWSDeviceStore } from "@/store/wsDeviceStore";
import { subscribe } from "@/services/websocket";

export function useDevices() {
    const [loading, setLoading] = useState(true);
    const [devices, setDevices] = useState<Device[]>([]);

    const liveStatus = useWSDeviceStore(
        (state: { liveStatus: any }) => state.liveStatus
    );

    const updateStatus = useWSDeviceStore(
        (state: { updateStatus: any }) => state.updateStatus
    );

    /* ================================
       Initial Load
    ================================= */

    useEffect(() => {
        async function load() {
            try {
                setLoading(true);
                const res = await devicesApi.list();
                setDevices(res.data || []); // FIXED
            } catch (err) {
                console.error("Failed to load devices", err);
                setDevices([]);
            } finally {
                setLoading(false);
            }
        }

        void load();
    }, []);

    /* ================================
       WebSocket Live Updates
    ================================= */

    useEffect(() => {
        const unsubscribe = subscribe((event) => {
            if (event.type === "device_status") {
                const payload = event.payload as {
                    deviceId: string;
                    status: string;
                };

                updateStatus(payload.deviceId, payload.status);
            }
        });

        return () => {
            unsubscribe();
        };
    }, [updateStatus]);

    /* ================================
       Return enriched devices
    ================================= */

    return {
        loading,
        devices: (devices || []).map((d) => ({
            ...d,
            live: liveStatus[d.deviceId] ?? d.status,
        })),
    };
}