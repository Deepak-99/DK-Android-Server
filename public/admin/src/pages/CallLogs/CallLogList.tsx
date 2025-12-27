import { CallLog } from "./types";

export default function CallLogList({
                                        logs,
                                        onSelect
                                    }: {
    logs: CallLog[];
    onSelect: (l: CallLog) => void;
}) {
    const typeColor = {
        incoming: "text-green-400",
        outgoing: "text-blue-400",
        missed: "text-yellow-400",
        rejected: "text-red-400"
    };

    return (
        <div className="w-96 border-r border-border overflow-y-auto">
            {logs.map((l) => (
                <div
                    key={l.id}
                    onClick={() => onSelect(l)}
                    className="p-4 hover:bg-accent cursor-pointer border-b border-border"
                >
                    <div className="flex justify-between">
                        <span className={`font-semibold ${typeColor[l.type]}`}>{l.type}</span>
                        <span className="text-xs text-muted-foreground">{new Date(l.timestamp).toLocaleString()}</span>
                    </div>

                    <div className="mt-1">
                        <div className="text-lg">{l.phone_number}</div>
                        {l.name && <div className="text-sm text-muted-foreground">{l.name}</div>}
                    </div>

                    <div className="text-xs text-muted-foreground mt-1">
                        Duration: {l.duration}s
                    </div>
                </div>
            ))}
        </div>
    );
}
