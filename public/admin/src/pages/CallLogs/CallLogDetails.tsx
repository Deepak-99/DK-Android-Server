import { CallLog } from "./types";

export default function CallLogDetails({ log }: { log: CallLog | null }) {
    if (!log)
        return (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
                Select a call log
            </div>
        );

    return (
        <div className="flex-1 p-6">
            <h2 className="text-2xl font-semibold mb-4">Call Details</h2>

            <div className="space-y-4">
                <div>
                    <div className="text-xs text-muted-foreground">Type</div>
                    <div className="text-lg capitalize">{log.type}</div>
                </div>

                <div>
                    <div className="text-xs text-muted-foreground">Number</div>
                    <div className="text-lg">{log.phone_number}</div>
                </div>

                {log.name && (
                    <div>
                        <div className="text-xs text-muted-foreground">Name</div>
                        <div className="text-lg">{log.name}</div>
                    </div>
                )}

                <div>
                    <div className="text-xs text-muted-foreground">Duration</div>
                    <div className="text-lg">{log.duration} seconds</div>
                </div>

                <div>
                    <div className="text-xs text-muted-foreground">Timestamp</div>
                    <div className="text-lg">
                        {new Date(log.timestamp).toLocaleString()}
                    </div>
                </div>
            </div>
        </div>
    );
}
