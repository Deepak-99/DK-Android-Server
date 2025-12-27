import { CallLog } from "./types";

export default function CallList({
                                     calls,
                                     onSelect
                                 }: {
    calls: CallLog[];
    onSelect: (c: CallLog) => void;
}) {
    return (
        <div className="w-96 border-r border-border overflow-y-auto">
            {calls.map(c => (
                <div
                    key={c.id}
                    className="p-4 hover:bg-accent cursor-pointer border-b border-border"
                    onClick={() => onSelect(c)}
                >
                    <div className="font-medium">
                        {c.contact_name || c.phone_number}
                    </div>
                    <div className="text-xs text-muted-foreground">
                        {c.type} • {new Date(c.timestamp).toLocaleString()}
                    </div>
                </div>
            ))}
        </div>
    );
}
