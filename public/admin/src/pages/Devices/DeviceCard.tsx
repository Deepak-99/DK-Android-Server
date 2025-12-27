import { Device } from "@/services/devicesApi";
import * as Icons from "lucide-react";
import { Link } from "react-router-dom";

export default function DeviceCard({ device }: { device: Device & { live: string } }) {
    return (
        <Link
            to={`/devices/${device.id}`}
            className="p-5 rounded-xl bg-card border border-border hover:border-accent transition shadow-sm"
        >
            <div className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                    <Icons.Phone className="w-7 h-7 text-accent" />
                    <div>
                        <div className="font-semibold text-text">{device.nickname || device.name}</div>
                        <div className="text-sm text-text-dim">
                            {device.manufacturer} {device.model}
                        </div>
                    </div>
                </div>

                <div
                    className={`w-3 h-3 rounded-full ${
                        device.live === "online" ? "bg-green-500" : "bg-red-500"
                    }`}
                />
            </div>

            <div className="mt-4 text-xs text-text-dim">
                Android {device.android_version} • App {device.app_version}
            </div>

            <div className="mt-1 text-xs text-text-dim">
                Last Seen: {new Date(device.lastSeen).toLocaleString()}
            </div>
        </Link>
    );
}
