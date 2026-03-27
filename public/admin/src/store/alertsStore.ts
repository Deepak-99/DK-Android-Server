import { create } from "zustand";

export const useAlertsStore = create((set:any)=>({

    alerts:[],

    add:(a:any)=>set((s:any)=>({
        alerts:[a,...s.alerts]
    }))

}));