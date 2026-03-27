import { create } from "zustand";

interface Store {
  liveStatus: Record<string,string>;
  metrics: Record<string,any>;
  updateStatus: (id:string,status:string)=>void;
  updateMetrics: (id:string,data:any)=>void;
}

export const useWSDeviceStore = create<Store>((set)=>({

  liveStatus:{},
  metrics:{},

  updateStatus:(id,status)=>
    set((s)=>({
      liveStatus:{...s.liveStatus,[id]:status}
    })),

  updateMetrics:(id,data)=>
    set((s)=>({
      metrics:{...s.metrics,[id]:data}
    }))

}));