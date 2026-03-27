import { useEffect, useState } from "react";
import { fileExplorerApi } from "@/services/fileApi";

export function useFileExplorer(deviceId: string) {

  const [files,setFiles] = useState<any[]>([]);
  const [path,setPath] = useState("/");
  const [loading,setLoading] = useState(true);

  useEffect(()=>{
    setLoading(true);

    fileExplorerApi.list(deviceId,path).then((data)=>{
      setFiles(data);
      setLoading(false);
    });

  },[deviceId,path]);

  return { files,path,setPath,loading };
}