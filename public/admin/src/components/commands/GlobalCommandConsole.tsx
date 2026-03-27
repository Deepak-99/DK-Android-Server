import { useState } from "react";
import { commandsApi } from "@/services/commandsApi";

export default function GlobalCommandConsole({devices}:any){

    const [cmd,setCmd] = useState("");

    const send = ()=>{
        devices.forEach((d:any)=>{
            commandsApi.send(d.deviceId,cmd);
        });
    };

    return (
        <div className="bg-card border border-border rounded-xl p-4">

            <h3 className="font-semibold mb-2">
                Global Command
            </h3>

            <div className="flex gap-2">

                <input
                    value={cmd}
                    onChange={e=>setCmd(e.target.value)}
                    className="flex-1 bg-bg border border-border rounded-lg px-2"
                />

                <button onClick={send} className="btn">
                    Send
                </button>

            </div>

        </div>
    );
}