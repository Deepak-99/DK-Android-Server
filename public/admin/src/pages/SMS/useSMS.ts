import { useEffect,useState } from "react";
import { smsApi } from "@/services/smsApi";

export function useSMS(deviceId:string){

  const [messages,setMessages] = useState([]);

  useEffect(()=>{
    smsApi.list(deviceId).then(setMessages);
  },[deviceId]);

  return { messages };
}