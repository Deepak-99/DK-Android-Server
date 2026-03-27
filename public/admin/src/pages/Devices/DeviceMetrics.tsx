import { useEffect, useState } from "react";
import { subscribe } from "@/services/websocket";

export default function DeviceMetrics() {
    const [cpu,setCpu] = useState(0);
    const [ram,setRam] = useState(0);

    useEffect(()=>{
        const unsub = subscribe((event:any)=>{
            if(event.type==="device_metrics"){
                setCpu(event.payload.cpu);
                setRam(event.payload.ram);
            }
        });

        return ()=>{
            if(typeof unsub==="function") unsub();
        }
    },[]);

    return (
        <div className="grid grid-cols-2 gap-4">

            <Metric title="CPU" value={cpu}/>
            <Metric title="RAM" value={ram}/>

        </div>
    );
}

function Metric({title,value}:any){
    return(
        <div className="bg-card border border-border rounded-xl p-4">
            <div className="text-sm text-muted">{title}</div>
            <div className="text-xl font-semibold">{value}%</div>
        </div>
    )
}