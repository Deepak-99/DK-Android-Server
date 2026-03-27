import { send } from "@/services/websocket";

export default function RemoteControl({deviceId}:any){

    const click = (e:any)=>{
        send({
            type:"touch",
            deviceId,
            x:e.nativeEvent.offsetX,
            y:e.nativeEvent.offsetY
        });
    };

    return (
        <div
            onClick={click}
            className="absolute inset-0 cursor-crosshair"
        />
    );
}