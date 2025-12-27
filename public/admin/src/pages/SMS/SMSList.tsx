import { SMSMessage } from "./types";

export default function SMSList({
                                    list,
                                    onSelect
                                }: {
    list: SMSMessage[];
    onSelect: (m: SMSMessage) => void;
}) {
    return (
        <div className="w-96 border-r border-border overflow-y-auto h-full">
            {list.map((m) => (
                <div
                    key={m.id}
                    className="p-4 border-b border-border hover:bg-accent cursor-pointer"
                    onClick={() => onSelect(m)}
                >
                    <div className="font-medium">{m.address}</div>
                    <div className="text-xs text-muted-foreground truncate">
                        {m.body}
                    </div>
                </div>
            ))}
        </div>
    );
}
