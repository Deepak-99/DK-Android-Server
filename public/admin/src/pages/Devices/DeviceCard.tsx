import {
  Smartphone,
  Battery,
  Wifi,
  WifiOff,
  Zap
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Props {
  device: any;
}

export default function DeviceCard({ device }: Props) {
  const navigate = useNavigate();

  const online = device.live === "online";

  return (
    <div
      onClick={() => navigate(`/devices/${device.id}`)}
      className={`rounded-xl p-4 cursor-pointer transition
        bg-card border
        ${online
          ? "border-success shadow-[0_0_12px_rgba(34,197,94,0.15)]"
          : "border-border hover:border-accent"
        }`}
    >
      {/* Header */}
      <div className="flex justify-between items-start">

        <div>
          <div className="flex items-center gap-2">
            <Smartphone size={18} />

            <span className="font-medium">
              {device.nickname || device.name}
            </span>

            {online && (
              <Zap size={14} className="text-success animate-pulse"/>
            )}
          </div>

          <div className="text-sm text-muted mt-1">
            {device.model}
          </div>
        </div>

        <div
          className={`px-2 py-1 text-xs rounded-md
          ${online
            ? "bg-success/20 text-success"
            : "bg-danger/20 text-danger"}`}
        >
          {online ? "Online" : "Offline"}
        </div>

      </div>

      {/* Status Row */}
      <div className="flex items-center justify-between mt-4 text-sm text-muted">

        <div className="flex items-center gap-2">
          {online ? <Wifi size={14}/> : <WifiOff size={14}/>}
          {online ? "Connected" : "Disconnected"}
        </div>

        {device.batteryLevel !== null && device.batteryLevel !== undefined && (
          <div className="flex items-center gap-1">
            <Battery size={14}/>
            {device.batteryLevel}%
          </div>
        )}

      </div>

      {/* Footer */}
      <div className="text-xs text-muted mt-3">
        Last seen: {new Date(device.lastSeen).toLocaleString()}
      </div>

    </div>
  );
}