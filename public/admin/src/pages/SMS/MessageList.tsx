import { SMSMessage } from "./types";

export default function MessageList({ messages }: any) {
    return (
        <div className="flex-1 p-4 overflow-auto space-y-2">
            {messages.map((m: SMSMessage) => (
                <div
                    key={m.id}
                    className={`max-w-xl p-3 rounded-lg ${
                        m.type === 1
                            ? "bg-neutral-800 self-start"
                            : "bg-blue-600 self-end"
                    }`}
                >
                    <div className="text-sm">{m.body}</div>
                    <div className="text-xs opacity-60">
                        {new Date(m.date).toLocaleString()}
                    </div>
                </div>
            ))}
        </div>
    );
}
