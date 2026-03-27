import { Camera, MapPin, Lock, RotateCcw } from "lucide-react";

export default function DeviceQuickActions({ onAction }: any) {
    const actions = [
        { id: "screenshot", icon: Camera, label: "Screenshot" },
        { id: "location", icon: MapPin, label: "Location" },
        { id: "lock", icon: Lock, label: "Lock" },
        { id: "restart", icon: RotateCcw, label: "Restart" },
    ];

    return (
        <div className="flex gap-2 flex-wrap">
            {actions.map(a => {
                const Icon = a.icon;
                return (
                    <button
                        key={a.id}
                        onClick={() => onAction(a.id)}
                        className="bg-card border border-border px-3 py-2 rounded-lg
                       hover:border-accent transition flex items-center gap-2"
                    >
                        <Icon size={14}/>
                        {a.label}
                    </button>
                );
            })}
        </div>
    );
}