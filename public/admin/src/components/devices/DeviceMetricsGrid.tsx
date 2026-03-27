import { useWSDeviceStore } from "@/store/wsDeviceStore";

export default function DeviceMetricsGrid({devices}:any){

    const metrics = useWSDeviceStore(s=>s.metrics);

    return (
        <div className="grid grid-cols-4 gap-4">

            {devices.map((d:any)=>(
                <div
                    key={d.deviceId}
                    className="bg-card border border-border rounded-xl p-3"
                >
                    <div className="text-sm">{d.name}</div>

                    <div className="text-xs text-muted">
                        CPU {metrics[d.deviceId]?.cpu ?? "--"}%
                    </div>

                    <div className="text-xs text-muted">
                        RAM {metrics[d.deviceId]?.ram ?? "--"}%
                    </div>
                </div>
            ))}

        </div>
    );
}