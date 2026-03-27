import {
  Smartphone,
  Battery,
  Cpu,
  Signal
} from "lucide-react";

interface Props {
  device: any;
}

export default function DeviceHeader({ device }: Props) {

  const online = device?.isOnline;

  const quality = device?.signalStrength ?? 0;

  return (
    <div className="bg-card border border-border rounded-xl p-5">

      <div className="flex justify-between items-center flex-wrap gap-4">

        {/* Left */}
        <div className="flex items-center gap-3">
          <Smartphone className="text-accent"/>

          <div>
            <div className="text-lg font-semibold">
              {device?.name}
            </div>

            <div className="text-sm text-muted">
              {device?.model} • Android {device?.osVersion}
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-5 text-sm">

          {/* Manufacturer */}
          <div className="flex items-center gap-1">
            <Cpu size={14}/>
            {device?.manufacturer || "Unknown"}
          </div>

          {/* Battery */}
          <div className="flex items-center gap-1">
            <Battery size={14}/>
            {device?.batteryLevel ?? "--"}%
          </div>

          {/* Signal Quality */}
          <div className="flex items-center gap-1">
            <Signal size={14}/>
            <div className="flex gap-[2px]">
              {[1,2,3,4].map(i => (
                <div
                  key={i}
                  className={`w-1 rounded-sm
                    ${quality >= i ? "bg-success" : "bg-border"}
                  `}
                  style={{ height: i * 4 }}
                />
              ))}
            </div>
          </div>

          {/* Status */}
          <div
            className={`px-2 py-1 rounded-md text-xs
              ${online
                ? "bg-success/20 text-success"
                : "bg-danger/20 text-danger"
              }`}
          >
            {online ? "Online" : "Offline"}
          </div>

        </div>

      </div>
    </div>
  );
}