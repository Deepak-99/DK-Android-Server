import DashboardLayout from "../../layouts/DashboardLayout";
import { useDevices } from "./useDevices";
import DeviceCard from "./DeviceCard";
import * as Icons from "lucide-react";
import { useState } from "react";

export default function DevicesPage() {
    const { loading, devices } = useDevices();
    const [search, setSearch] = useState("");

    const filtered = devices.filter((d) =>
        (d.nickname || d.name)
            .toLowerCase()
            .includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-text">
                        Devices
                    </h1>
                    <p className="text-sm text-text-dim">
                        Monitor and control connected devices
                    </p>
                </div>

                <button
                    onClick={() => window.location.reload()}
                    className="flex items-center px-4 py-2 bg-accent text-white rounded-lg shadow hover:opacity-90"
                >
                    <Icons.RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                </button>
            </div>

            {/* Search */}
            <div className="flex items-center bg-card border border-border rounded-lg px-3 py-2">
                <Icons.Search className="w-4 h-4 text-text-dim mr-2" />
                <input
                    placeholder="Search devices..."
                    className="bg-transparent outline-none w-full"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                <StatCard
                    label="Total"
                    value={devices.length}
                    icon={<Icons.Smartphone />}
                />
                <StatCard
                    label="Online"
                    value={devices.filter(d => d.live === "online").length}
                    icon={<Icons.Wifi />}
                />
                <StatCard
                    label="Offline"
                    value={devices.filter(d => d.live === "offline").length}
                    icon={<Icons.WifiOff />}
                />
            </div>

            {/* Grid */}
            {loading && (
                <div className="text-text-dim">Loading devices…</div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filtered.map((d) => (
                    <DeviceCard key={d.id} device={d} />
                ))}
            </div>
        </div>
    );
}

function StatCard({ label, value, icon }: any) {
    return (
        <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
            <div>
                <div className="text-sm text-text-dim">{label}</div>
                <div className="text-xl font-semibold">{value}</div>
            </div>
            <div className="text-accent">{icon}</div>
        </div>
    );
}