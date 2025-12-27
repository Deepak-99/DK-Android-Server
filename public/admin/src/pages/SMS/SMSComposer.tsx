import { useState } from "react";

export default function SMSComposer({ onSend }: any) {
    const [number, setNumber] = useState("");
    const [text, setText] = useState("");

    function send() {
        if (!number || !text) return;
        onSend(number, text);
        setText("");
    }

    return (
        <div className="p-4 border-t border-border flex gap-2">
            <input
                placeholder="Phone number"
                className="bg-muted p-2 rounded-md w-40"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
            />
            <input
                placeholder="Type a message..."
                className="flex-1 bg-muted p-2 rounded-md"
                value={text}
                onChange={(e) => setText(e.target.value)}
            />
            <button
                className="px-4 py-2 bg-primary text-white rounded-lg"
                onClick={send}
            >
                Send
            </button>
        </div>
    );
}
