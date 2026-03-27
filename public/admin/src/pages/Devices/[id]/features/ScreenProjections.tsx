import { useEffect, useRef } from "react";
import { subscribe, send } from "@/services/websocket";

export default function ScreenProjections({deviceId}:any){

  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(()=>{

    send({
      type:"screen_start",
      deviceId
    });

    const unsub = subscribe((event:any)=>{
      if(event.type==="screen_frame"){
        const ctx = canvasRef.current?.getContext("2d");
        const img = new Image();

        img.onload = ()=>ctx?.drawImage(img,0,0);
        img.src = event.payload;
      }
    });

    return ()=>{
      send({type:"screen_stop",deviceId});
      unsub?.();
    }

  },[deviceId]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full border border-border rounded-xl"
    />
  );
}