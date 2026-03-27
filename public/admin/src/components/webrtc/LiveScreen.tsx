import { useEffect, useRef } from "react";
import { subscribe } from "@/services/websocket";

export default function LiveScreen() {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        const unsub = subscribe((event:any)=>{
            if(event.type==="screen_stream"){
                if(videoRef.current){
                    videoRef.current.srcObject = event.payload.stream;
                }
            }
        });

        return ()=>{
            if(typeof unsub==="function") unsub();
        }
    },[]);

    return (
        <div className="bg-card border border-border rounded-xl p-4">
            <video
                ref={videoRef}
                autoPlay
                className="w-full rounded-lg"
            />
        </div>
    );
}