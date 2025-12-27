import { SMSMessage } from "./types";

export default function ConversationView({
                                             messages
                                         }: {
    messages: SMSMessage[];
}) {
    if (!messages.length)
        return (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
                Select an SMS or thread
            </div>
        );

    return (
        <div className="flex-1 p-6 space-y-4 overflow-y-auto">
            {messages.map((m) => (
                <div
                    key={m.id}
                    className={`p-3 rounded-lg max-w-[70%] ${
                        m.type === 1 ? "bg-neutral-700 text-left" : "bg-primary text-right"
                    }`}
                >
                    <div>{m.body}</div>
                    <div className="text-xs text-muted-foreground">
                        {new Date(m.date).toLocaleString()}
                    </div>
                </div>
            ))}
        </div>
    );
}
