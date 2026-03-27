import { useEffect,useState } from "react";
import { callLogsApi } from "@/services/callLogsApi";

export function useCallLogs(deviceId:string){

  const [logs,setLogs] = useState([]);

  useEffect(()=>{
    callLogsApi.list(deviceId).then(setLogs);
  },[deviceId]);

  return { logs };
}