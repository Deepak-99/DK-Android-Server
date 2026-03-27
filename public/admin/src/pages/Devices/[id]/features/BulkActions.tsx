import { commandsApi } from "@/services/commandsApi";

export default function BulkActions({devices}:any){

    const sendAll = (cmd:string)=>{
        devices.forEach((d:any)=>{
            commandsApi.send(d.deviceId,cmd);
        });
    };

    return (
        <div className="flex gap-2">

            <button
                onClick={()=>sendAll("lock_device")}
                className="btn"
            >
                Lock All
            </button>

            <button
                onClick={()=>sendAll("restart")}
                className="btn"
            >
                Restart All
            </button>

        </div>
    );
}