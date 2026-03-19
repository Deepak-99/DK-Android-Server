import type { Device } from "../../services/devicesApi";

type DeviceWithLive = Device & {
    live: "online" | "offline";
};

export default function DeviceTable({
    devices
}: {
    devices: DeviceWithLive[];
}) {
    return (
        <table className="w-full text-sm">
            <thead className="text-text-dim border-b border-border">
                <tr>
                    <th className="py-2 text-left">Device</th>
                    <th className="py-2 text-center">OS</th>
                    <th className="py-2 text-center">App</th>
                    <th className="py-2 text-center">Status</th>
                    <th className="py-2 text-center">Last Seen</th>
                </tr>
            </thead>

            <tbody>
                {devices.map((d) => (
                    <tr key={d.id} className="border-b border-border">
                        <td className="py-3">
                            {d.nickname || d.name}
                        </td>

                        <td className="text-center">
                            Android {d.android_version}
                        </td>

                        <td className="text-center">
                            {d.app_version}
                        </td>

                        <td className="text-center">
                            <span
                                className={`px-3 py-1 text-xs rounded-md ${
                                    d.live === "online"
                                        ? "bg-green-600/20 text-green-400"
                                        : "bg-red-600/20 text-red-400"
                                }`}
                            >
                                {d.live}
                            </span>
                        </td>

                        <td className="text-center text-text-dim">
                            {d.lastSeen
                                ? new Date(d.lastSeen).toLocaleString()
                                : "Never"}
                        </td>
                    </tr>
                ))}

                {devices.length === 0 && (
                    <tr>
                        <td colSpan={5} className="text-center py-6 text-text-dim">
                            No devices found
                        </td>
                    </tr>
                )}
            </tbody>
        </table>
    );
}
