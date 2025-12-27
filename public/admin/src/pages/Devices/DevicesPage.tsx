import DashboardLayout from "@/layout/DashboardLayout";
import { useDevices } from "./useDevices";
import DeviceCard from "./DeviceCard";
import * as Icons from "lucide-react";

export default function DevicesPage() {
    const { loading, devices } = useDevices();

    return (
        <DashboardLayout>
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Devices</h2>

                <button className="flex items-center px-3 py-1.5 bg-accent/20 text-accent rounded-md">
                    <Icons.RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                </button>
            </div>

            {loading && <div className="text-text-dim">Loading devices…</div>}

            {!loading && devices.length === 0 && (
                <div className="text-text-dim">No devices registered.</div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {devices.map((d) => (
                    <DeviceCard key={d.id} device={d} />
                ))}
            </div>
        </DashboardLayout>
    );
}
