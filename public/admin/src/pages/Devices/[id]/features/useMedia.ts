import { useEffect,useState } from "react";
import { mediaApi } from "@/services/mediaApi";

export function useMedia(deviceId:string){

    const [media,setMedia] = useState([]);

    useEffect(()=>{
        mediaApi.list(deviceId).then(setMedia);
    },[deviceId]);

    return { media };
}