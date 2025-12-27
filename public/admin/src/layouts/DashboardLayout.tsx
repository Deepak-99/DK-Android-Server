import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

export default function DashboardLayout({ children }: { children: any }) {
    return (
        <div className="flex h-screen bg-bg text-text">
            <Sidebar />

            <div className="flex flex-col flex-1">
                <TopBar />

                <div className="flex-1 overflow-auto p-6">{children}</div>
            </div>
        </div>
    );
}
