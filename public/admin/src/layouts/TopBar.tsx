import { useAuthStore } from "../store/authStore";
import * as Icons from "lucide-react";
import { useEffect, useState } from "react";
import { disconnect, onStatusChange } from "../services/websocket";
import api from "../api/axios";
import { clearToken } from "../utils/token";

export default function TopBar() {
  const { user } = useAuthStore();

  const [wsStatus, setWsStatus] = useState<
    "connecting" | "connected" | "reconnecting" | "disconnected"
  >("connecting");

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // ignore backend failure
    }

        // 🔥 CLEAR CLIENT STATE
        clearToken();
        disconnect();

    // Redirect
    window.location.href = "/login";
  };

  useEffect(() => {
    const unsubscribe = onStatusChange(setWsStatus);

    return () => {
      void unsubscribe(); // ensures void return
    };
  }, []);

  return (
    <div className="h-14 bg-bg-secondary border-b border-border flex items-center justify-between px-6">
      <div className="text-text text-lg font-semibold">Dashboard</div>

      <div className="flex items-center space-x-3">
        <span className="text-text-dim text-sm">{user?.email}</span>

        <button
          className="text-text-dim hover:text-text"
          onClick={async () => {
            await logout();
          }}
        >
          <Icons.LogOut className="w-5 h-5" />
        </button>
      </div>

      <span
        style={{
          padding: "4px 8px",
          borderRadius: "4px",
          background:
            wsStatus === "connected"
              ? "green"
              : wsStatus === "reconnecting"
              ? "orange"
              : "red",
          color: "white",
          fontSize: "12px",
        }}
      >
        {wsStatus === "connected" ? "LIVE" : wsStatus.toUpperCase()}
      </span>
    </div>
  );
}
