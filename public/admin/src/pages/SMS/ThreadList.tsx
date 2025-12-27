import { SMSThread } from "./types";

export default function ThreadList({ threads, onSelect }: any) {
    return (
        <div className="w-80 border-r border-border overflow-auto">
            {threads.map((t: SMSThread) => (
                <div
                    key={t.thread_id}
                    onClick={() => onSelect(t.thread_id)}
                    className="p-3 hover:bg-neutral-800 cursor-pointer border-b border-border"
                >
                    <div className="font-semibold">
                        {t.contact_name || t.address}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                        {t.last_message}
                    </div>
                    {t.unread_count > 0 && (
                        <span className="text-xs text-red-500">
              {t.unread_count} unread
            </span>
                    )}
                </div>
            ))}
        </div>
    );
}
