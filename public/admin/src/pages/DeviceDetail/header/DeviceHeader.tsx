import { useDeviceDetail } from "../useDeviceDetail";
import * as Icons from "lucide-react";

export default function DeviceHeader({ deviceId }: { deviceId: string }) {
    const { info, loading } = useDeviceDetail(deviceId);

    if (loading || !info) return <div>Loading…</div>;

    return (
        <div className="p-5 rounded-xl bg-card border border-border shadow-sm">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-semibold">{info.nickname || info.name}</h2>
                    <div className="text-text-dim text-sm">
                        {info.manufacturer} {info.model} — Android {info.android_version}
                    </div>
                </div>

                <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2 text-text-dim">
                        <Icons.Battery className="w-5 h-5" />
                        <span>{info.battery}%</span>
                    </div>

                    <div
                        className={`w-3 h-3 rounded-full ${
                            info.isOnline ? "bg-green-500" : "bg-red-500"
                        }`}
                    ></div>
                </div>
            </div>
        </div>
    );
}
