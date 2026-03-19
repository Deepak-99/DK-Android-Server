import DashboardLayout from "../../layouts/DashboardLayout";
import { useDevices } from "./useDevices";
import DeviceCard from "./DeviceCard";
import * as Icons from "lucide-react";
import { useEffect, useState } from 'react';
import { subscribe } from '../../services/websocket';
import api from '../../api/axios';
import type { Device } from "../../services/devicesApi";

export default function DevicesPage() {
    const { loading } = useDevices();
    const [devices, setDevices] = useState<(Device & { live: string })[]>([]);
    const [error, setError] = useState<string | null>(null);

    /* ================================
       Load Devices
    ================================= */

    const loadDevices = async () => {
        try {
            const res = await api.get<Device[]>('/devices');

            // Map status → live (if needed)
            const mapped = res.data.map((d) => ({
                ...d,
                live: d.status === 'online' ? 'online' : 'offline'
            }));

            setDevices(mapped);
            setError(null);
        } catch (err: any) {
            setError(err.message);
        }
    };

    /* ================================
       Initial Load
    ================================= */

    useEffect(() => {
        void loadDevices(); // prevent ignored promise warning
    }, []);

    /* ================================
       WebSocket Updates
    ================================= */

    useEffect(() => {

        const unsubscribe = subscribe((event) => {

            if (
                event.type === 'device_connected' ||
                event.type === 'device_disconnected'
            ) {
                void loadDevices();
            }

        });

        return () => {
            unsubscribe(); // MUST return void
        };

    }, []);

    /* ================================
       UI
    ================================= */

    return (
        <DashboardLayout>

            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Devices</h2>

                <button
                    onClick={() => void loadDevices()}
                    className="flex items-center px-3 py-1.5 bg-accent/20 text-accent rounded-md"
                >
                    <Icons.RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                </button>
            </div>

            {error && (
                <div className="error-box mb-4">
                    {error}
                </div>
            )}

            {loading && (
                <div className="text-text-dim">
                    Loading devices…
                </div>
            )}

            {!loading && devices.length === 0 && !error && (
                <div className="text-text-dim">
                    No devices found
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {devices.map((d) => (
                    <DeviceCard key={d.id} device={d} />
                ))}
            </div>

        </DashboardLayout>
    );
}
