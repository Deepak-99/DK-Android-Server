import { useEffect, useState } from "react";
import { subscribe } from "@/services/websocket";

export default function RealtimeChart() {
    const [data, setData] = useState<number[]>([]);

    useEffect(() => {
        const unsub = subscribe((event: any) => {
            if (event.type === "device_stats") {
                setData(prev => [...prev.slice(-20), event.payload.count]);
            }
        });

        return () => {
            if (typeof unsub === "function") {
                unsub();
            }
        };
    }, []);

    return (
        <div className="bg-card border border-border rounded-xl p-4">

            <h3 className="font-semibold mb-3">
                Live Device Activity
            </h3>

            <div className="flex items-end gap-1 h-32">
                {data.map((v, i) => (
                    <div
                        key={i}
                        className="bg-accent w-2 rounded-sm"
                        style={{ height: `${v * 10}px` }}
                    />
                ))}
            </div>

        </div>
    );
}