import { Device } from "@/services/devicesApi";

export default function DeviceTable({ devices }: { devices: any[] }) {
    return (
        <table className="w-full text-sm">
            <thead className="text-text-dim border-b border-border">
            <tr>
                <th className="py-2 text-left">Device</th>
                <th className="py-2">OS</th>
                <th className="py-2">App</th>
                <th className="py-2">Status</th>
                <th className="py-2">Last Seen</th>
            </tr>
            </thead>
            <tbody>
            {devices.map((d) => (
                <tr key={d.id} className="border-b border-border">
                    <td className="py-3">{d.nickname || d.name}</td>
                    <td className="text-center">Android {d.android_version}</td>
                    <td className="text-center">{d.app_version}</td>
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
                        {new Date(d.lastSeen).toLocaleString()}
                    </td>
                </tr>
            ))}
            </tbody>
        </table>
    );
}
