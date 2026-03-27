import { useEffect } from "react";
import { subscribe } from "@/services/websocket";
import { showToast } from "@/utils/toast";

export default function AlertsListener(){

  useEffect(()=>{
    const unsub = subscribe((event:any)=>{

      if(event.type === "device_offline"){
        showToast(`Device offline: ${event.deviceId}`, "error");
      }

      if(event.type === "device_online"){
        showToast(`Device online: ${event.deviceId}`, "success");
      }

      if(event.type === "command_failed"){
        showToast(`Command failed`, "error");
      }

    });

    return ()=>unsub?.();
  },[]);

  return null;
}