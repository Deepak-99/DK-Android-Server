import { useEffect, useState } from "react";
import { subscribe } from "@/services/websocket";

export default function CommandLog() {
    const [logs, setLogs] = useState<any[]>([]);

    useEffect(() => {
        const unsubscribe = subscribe((event: any) => {
            if (event.type === "command_result") {
                setLogs((prev) => [event.payload, ...prev]);
            }
        });

        return () => {
            if (typeof unsubscribe === "function") {
                unsubscribe();
            }
        };
    }, []);

    return (
        <div className="bg-card border border-border rounded-xl p-4">
            <h3 className="font-semibold mb-3">Command Logs</h3>

            <div className="space-y-2 text-sm">
                {logs.map((l, i) => (
                    <div key={i} className="border-b border-border pb-1">
                        {l.command} — {l.status}
                    </div>
                ))}
            </div>
        </div>
    );
}