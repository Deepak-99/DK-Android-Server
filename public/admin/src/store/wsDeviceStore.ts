import { create } from "zustand";

interface WSDeviceState {
    liveStatus: Record<string, "online" | "offline">;
    updateStatus: (deviceId: string, status: string) => void;
}

export const useWSDeviceStore = create<WSDeviceState>((set) => ({
    liveStatus: {},

    updateStatus: (deviceId, status) =>
        set((state) => ({
            liveStatus: {
                ...state.liveStatus,
                [deviceId]: status === "online" ? "online" : "offline",
            },
        })),
}));
