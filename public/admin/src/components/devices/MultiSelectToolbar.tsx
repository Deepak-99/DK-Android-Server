import { commandsApi } from "@/services/commandsApi";

export default function MultiSelectToolbar({selected}:any){

    const send = (cmd:string)=>{
        selected.forEach((d:any)=>{
            commandsApi.send(d.deviceId,cmd);
        });
    };

    if(!selected.length) return null;

    return (
        <div className="bg-card border border-border rounded-xl p-3 flex gap-2">

      <span className="text-sm text-muted">
        {selected.length} selected
      </span>

            <button
                onClick={()=>send("lock_device")}
                className="btn"
            >
                Lock
            </button>

            <button
                onClick={()=>send("restart")}
                className="btn"
            >
                Restart
            </button>

        </div>
    );
}