import { SMSMessage } from "./types";

export default function MessageThread({ messages }: { messages: SMSMessage[] }) {
    return (
        <div className="flex-1 overflow-y-auto p-4">
            {messages.map((m) => (
                <div
                    key={m.id}
                    className={`mb-3 max-w-[70%] p-3 rounded-xl ${
                        m.type === 1
                            ? "bg-muted self-start"
                            : "bg-primary text-white self-end ml-auto"
                    }`}
                >
                    <div>{m.body}</div>
                    <div className="text-xs opacity-70 mt-1">{new Date(m.date).toLocaleString()}</div>
                </div>
            ))}
        </div>
    );
}
