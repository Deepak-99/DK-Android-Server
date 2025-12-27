import { useState } from "react";
import { NavLink } from "react-router-dom";
import { MENU_ITEMS } from "./MenuConfig";
import * as Icons from "lucide-react";

export default function Sidebar() {
    const [collapsed, setCollapsed] = useState(false);

    return (
        <div
            className={`h-screen bg-bg-secondary border-r border-border transition-all duration-300
        ${collapsed ? "w-20" : "w-64"}
      `}
        >
            {/* Top section */}
            <div className="flex items-center justify-between p-4 border-b border-border">
                {!collapsed && (
                    <h1 className="text-lg font-semibold text-text">Hawkshaw</h1>
                )}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="p-2 text-text-dim hover:text-text"
                >
                    <Icons.ChevronLeft
                        className={`transition-transform ${collapsed ? "rotate-180" : ""}`}
                    />
                </button>
            </div>

            {/* MENU */}
            <div className="mt-4 space-y-1">
                {MENU_ITEMS.map((item) => {
                    const Icon = (Icons as any)[item.icon];

                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `flex items-center px-4 py-3 rounded-md mx-2 transition-colors
                ${
                                    isActive
                                        ? "bg-accent-soft text-accent"
                                        : "text-text-dim hover:text-text hover:bg-bg"
                                }`
                            }
                        >
                            <Icon className="w-5 h-5" />
                            {!collapsed && (
                                <span className="ml-3 text-sm font-medium">{item.label}</span>
                            )}
                        </NavLink>
                    );
                })}
            </div>
        </div>
    );
}
