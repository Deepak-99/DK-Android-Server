import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Avatar,
  IconButton,
  Chip,
  Badge,
  Tooltip
} from "@mui/material";

import {
  LogOut,
  Wifi,
  WifiOff,
  Smartphone,
  Bell,
  Activity,
  Server
} from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { useWSDeviceStore } from "@/store/wsDeviceStore";
import { subscribe } from "@/services/websocket";
import api from "@/services/api";

import { useEffect, useState } from "react";

const Navbar = () => {
  const { user, logout } = useAuth();

  const liveStatus = useWSDeviceStore((s: any) => s.liveStatus);

  const [connected, setConnected] = useState(false);
  const [notifications, setNotifications] = useState(0);
  const [pendingCommands, setPendingCommands] = useState(0);
  const [cpu, setCpu] = useState(0);
  const [serverUp, setServerUp] = useState(true);

  /* -----------------------------
     WebSocket indicator
  ----------------------------- */
  useEffect(() => {
    const unsub = subscribe((event) => {
      setConnected(true);

      // notifications
      if (event.type === "alert") {
        setNotifications((n) => n + 1);
      }

      // command updates
      if (event.type === "command_update") {
        setPendingCommands(event.payload?.pending || 0);
      }

      // metrics
      if (event.type === "server_metrics") {
        setCpu(event.payload?.cpu || 0);
      }
    });

    return () => unsub();
  }, []);

  /* -----------------------------
     Poll server health
  ----------------------------- */
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        await api.get("/health");
        setServerUp(true);
      } catch {
        setServerUp(false);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const liveCount = Object.values(liveStatus).filter(
    (s: any) => s === "online"
  ).length;

  return (
    <AppBar
      position="static"
      elevation={0}
      sx={{
        backgroundColor: "#11161c",
        borderBottom: "1px solid #1f2933"
      }}
    >
      <Toolbar
        sx={{
          minHeight: "56px",
          display: "flex",
          justifyContent: "space-between"
        }}
      >
        {/* LEFT */}
        <Typography variant="h6" sx={{ fontWeight: 500 }}>
          Hawkshaw Dashboard
        </Typography>

        {/* RIGHT */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2
          }}
        >
          {/* websocket */}
          <Chip
            size="small"
            icon={connected ? <Wifi size={14} /> : <WifiOff size={14} />}
            label={connected ? "Live" : "Offline"}
            sx={{
              backgroundColor: connected
                ? "rgba(34,197,94,0.15)"
                : "rgba(239,68,68,0.15)",
              color: connected ? "#22c55e" : "#ef4444"
            }}
          />

          {/* devices online */}
          <Chip
            size="small"
            icon={<Smartphone size={14} />}
            label={`${liveCount} online`}
            sx={{
              backgroundColor: "rgba(59,130,246,0.15)",
              color: "#3b82f6"
            }}
          />

          {/* CPU */}
          <Tooltip title="Server CPU">
            <Chip
              size="small"
              icon={<Activity size={14} />}
              label={`${cpu}%`}
              sx={{
                backgroundColor: "rgba(245,158,11,0.15)",
                color: "#f59e0b"
              }}
            />
          </Tooltip>

          {/* server health */}
          <Tooltip title="Server health">
            <Chip
              size="small"
              icon={<Server size={14} />}
              label={serverUp ? "OK" : "Down"}
              sx={{
                backgroundColor: serverUp
                  ? "rgba(34,197,94,0.15)"
                  : "rgba(239,68,68,0.15)",
                color: serverUp ? "#22c55e" : "#ef4444"
              }}
            />
          </Tooltip>

          {/* command queue */}
          <Badge badgeContent={pendingCommands} color="warning">
            <Tooltip title="Pending commands">
              <Activity size={18} />
            </Tooltip>
          </Badge>

          {/* notifications */}
          <IconButton
            onClick={() => setNotifications(0)}
            sx={{ color: "#9aa4af" }}
          >
            <Badge badgeContent={notifications} color="error">
              <Bell size={18} />
            </Badge>
          </IconButton>

          {/* avatar */}
          <Avatar
            sx={{
              width: 32,
              height: 32,
              bgcolor: "#3b82f6",
              fontSize: 14
            }}
          >
            {user?.username?.[0]?.toUpperCase() || "A"}
          </Avatar>

          {/* logout */}
          <IconButton
            onClick={logout}
            sx={{
              color: "#9aa4af",
              "&:hover": {
                color: "#ef4444"
              }
            }}
          >
            <LogOut size={18} />
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;