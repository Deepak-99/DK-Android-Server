import {
  LayoutDashboard,
  Smartphone,
  Map,
  MessageSquare,
  Phone,
  Settings,
  Command
} from "lucide-react";
import { NavLink } from "react-router-dom";

const menu = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/" },
  { label: "Devices", icon: Smartphone, path: "/devices" },
  { label: "Location", icon: Map, path: "/location" },
  { label: "SMS", icon: MessageSquare, path: "/sms" },
  { label: "Calls", icon: Phone, path: "/calls" },
  { label: "Commands", icon: Command, path: "/commands" },
  { label: "Settings", icon: Settings, path: "/settings" },
];

export default function Sidebar() {
  return (
    <aside className="w-64 bg-card border-r border-border min-h-screen p-4">

      <div className="text-lg font-semibold mb-6 text-text">
        Android Server
      </div>

      <nav className="space-y-2">
        {menu.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg transition-all
                 ${isActive
                    ? "bg-accent text-white"
                    : "text-muted hover:bg-border hover:text-text"
                 }`
              }
            >
              <Icon size={18}/>
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

    </aside>
  );
}