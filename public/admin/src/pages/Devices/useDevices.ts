import { useEffect, useState } from "react";
import { devicesApi, Device } from "../../services/devicesApi";
import { useWSDeviceStore } from "../../store/wsDeviceStore";
import { subscribe } from "../../services/websocket";

export function useDevices() {
    const [loading, setLoading] = useState(true);
    const [devices, setDevices] = useState<Device[]>([]);

    const liveStatus = useWSDeviceStore((state) => state.liveStatus);
    const updateStatus = useWSDeviceStore((state) => state.updateStatus);

    /* ================================
       Initial Load
    ================================= */

    useEffect(() => {

        async function load() {
            try {
                setLoading(true);
                const res = await devicesApi.list();
                setDevices(res.data.devices);
            } finally {
                setLoading(false);
            }
        }

        void load(); // prevent ignored promise warning

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
        devices: devices.map((d) => ({
            ...d,
            live: liveStatus[d.deviceId] ?? d.status,
        })),
    };
}
