import DashboardLayout from "../../layouts/DashboardLayout";
import { useDevices } from "./useDevices";
import { useNavigate } from "react-router-dom";
import { RefreshCw, Wifi, WifiOff, Smartphone } from "lucide-react";
import { useState } from "react";

export default function DevicesPage() {
  const { loading, devices, refresh } = useDevices();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const filtered = devices.filter(d =>
    (d.name + (d.nickname || ""))
      .toLowerCase()
      .includes(search.toLowerCase())
  );

    const online = devices.filter(
        d => d.status === "active" || d.status === "online"
    ).length;

    function StatCard({ title, value, color }: any) {
        return (
            <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
                <div className="text-sm text-muted">{title}</div>
                <div className={`text-2xl font-semibold mt-1 ${color}`}>
                    {value}
                </div>
            </div>
        );
    }

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">Devices</h1>
          <p className="text-muted text-sm">
            Monitor and control connected Android devices
          </p>
        </div>

        <button
          onClick={refresh}
          className="flex items-center gap-2 px-4 py-2
          bg-accent text-white rounded-lg hover:opacity-90"
        >
          <RefreshCw size={16}/>
          Refresh
        </button>
      </div>

      {/* STATS */}
        <div className="grid grid-cols-3 gap-4">

            <StatCard
                title="Total Devices"
                value={devices.length}
                color="text-blue-400"
            />

            <StatCard
                title="Online"
                value={online}
                color="text-green-400"
            />

            <StatCard
                title="Offline"
                value={devices.length-online}
                color="text-red-400"
            />

        </div>

      {/* SEARCH */}
      <input
        placeholder="Search devices..."
        className="w-full bg-card border border-border rounded-lg px-4 py-2"
        value={search}
        onChange={e=>setSearch(e.target.value)}
      />

      {/* TABLE */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">

        <table className="w-full text-sm">
          <thead className="bg-border text-muted">
            <tr>
              <th className="text-left px-4 py-3">Device</th>
              <th className="text-left px-4 py-3">Model</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Battery</th>
              <th className="text-left px-4 py-3">Last Seen</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map(d => (
              <tr
                key={d.deviceId}
                onClick={()=>navigate(`/devices/${d.deviceId}`)}
                className="border-t border-border
                    hover:bg-bg cursor-pointer
                    transition-all duration-150"
              >
                <td className="px-4 py-3">
                  {d.nickname || d.name}
                </td>

                <td className="px-4 py-3 text-muted">
                  {d.model}
                </td>

                <td className="px-4 py-3">
                    <Status status={d.status}/>
                </td>

                <td className="px-4 py-3">
                  {d.batteryLevel ?? "--"}%
                </td>

                <td className="px-4 py-3 text-muted">
                  {d.lastSeen
                    ? new Date(d.lastSeen).toLocaleString()
                    : "--"}
                </td>

              </tr>
            ))}
          </tbody>
        </table>

      </div>

    </div>
  );
}

function Stat({label,value,icon}:any){
  return(
    <div className="bg-card border border-border rounded-xl p-4 flex justify-between">
      <div>
        <div className="text-muted text-sm">{label}</div>
        <div className="text-xl font-semibold">{value}</div>
      </div>
      <div className="text-accent">{icon}</div>
    </div>
  )
}

function Status({ status }: { status: string }) {
    const online = status === "active" || status === "online";

    return (
        <span className={`px-2 py-1 rounded-md text-xs
      ${online
            ? "bg-success/20 text-success"
            : "bg-danger/20 text-danger"
        }`}>
      {online ? "Online" : "Offline"}
    </span>
    )
}