import { useState } from "react";
import { smsApi } from "@/services/smsApi";
import { toast } from "sonner";

export default function SendSMSModal({
                                         open,
                                         onClose,
                                         deviceId
                                     }: {
    open: boolean;
    onClose: () => void;
    deviceId: string;
}) {
    const [to, setTo] = useState("");
    const [body, setBody] = useState("");

    async function send() {
        await smsApi.send(deviceId, to, body);
        toast.success("SMS sent");
        onClose();
    }

    if (!open) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-neutral-900 p-6 rounded-lg space-y-4 w-96">
                <h2 className="text-lg font-bold">Send SMS</h2>

                <input className="input" placeholder="Phone Number" onChange={(e) => setTo(e.target.value)} />
                <textarea className="input min-h-[120px]" placeholder="Message" onChange={(e) => setBody(e.target.value)} />

                <div className="flex justify-end gap-2">
                    <button className="btn" onClick={onClose}>Cancel</button>
                    <button className="btn-primary" onClick={send}>Send</button>
                </div>
            </div>
        </div>
    );
}
