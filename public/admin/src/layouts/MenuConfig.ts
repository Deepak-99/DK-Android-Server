export interface MenuItem {
    label: string;
    path: string;
    icon: string; // lucide icons
}

export const MENU_ITEMS: MenuItem[] = [
    { label: "Dashboard", path: "/", icon: "LayoutDashboard" },

    // Device-level
    { label: "Device Info", path: "/devices", icon: "Phone" },
    { label: "Accessibility", path: "/accessibility", icon: "Eye" },
    { label: "Installed Apps", path: "/apps", icon: "AppWindow" },
    { label: "App Logs", path: "/applogs", icon: "ScrollText" },
    { label: "App Updates", path: "/app-updates", icon: "Upload" },

    // Telemetry
    { label: "Call Logs", path: "/call-logs", icon: "PhoneCall" },
    { label: "Call Recordings", path: "/recordings/calls", icon: "Mic" },
    { label: "SMS", path: "/sms", icon: "MessageSquare" },
    { label: "Contacts", path: "/contacts", icon: "Users" },

    // Remote control
    { label: "Commands", path: "/commands", icon: "TerminalSquare" },
    { label: "Camera", path: "/camera", icon: "Camera" },
    { label: "Screenshot", path: "/screenshot", icon: "MonitorSmartphone" },
    { label: "Record Audio", path: "/record-audio", icon: "Mic" },

    // File System
    { label: "File Explorer", path: "/file-explorer", icon: "Folder" },

    // Location
    { label: "Location", path: "/location", icon: "MapPin" },

    // Screen-based
    { label: "Screen Projection", path: "/projection", icon: "Monitor" },
    { label: "Screen Recording", path: "/recordings/screen", icon: "Video" },

    // Config
    { label: "Dynamic Config", path: "/configs", icon: "Settings" },
];
