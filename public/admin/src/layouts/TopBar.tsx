import { useAuthStore } from "@/store/authStore";
import * as Icons from "lucide-react";

export default function TopBar() {
    const { user, logout } = useAuthStore();

    return (
        <div className="h-14 bg-bg-secondary border-b border-border flex items-center justify-between px-6">
            <div className="text-text text-lg font-semibold">Dashboard</div>

            <div className="flex items-center space-x-3">
                <span className="text-text-dim text-sm">{user?.email}</span>

                <button
                    className="text-text-dim hover:text-text"
                    onClick={() => {
                        logout();
                        window.location.href = "/admin/login";
                    }}
                >
                    <Icons.LogOut className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}
