import { Routes, Route } from "react-router-dom";
import LoginPage from "@/pages/Login/LoginPage";
import NotFoundPage from "@/pages/NotFound/NotFoundPage";
import ProtectedRoute from "@/components/ProtectedRoute";
import DevicesPage from "@/pages/devices/DevicesPage";
import DashboardPage from "@/pages/dashboard/DashboardPage";
import DeviceDetailPage from "@/pages/DeviceDetail/DeviceDetailPage";

export default function Router() {
    return (
        <Routes>
            <Route path="/login" element={<LoginPage />} />

            {/* protected */}
            <Route
                path="/"
                element={
                    <ProtectedRoute>
                        <DashboardPage />
                    </ProtectedRoute>
                }
            />

            <Route path="*" element={<NotFoundPage />} />
            <Route
                path="/devices"
                element={
                    <ProtectedRoute>
                        <DevicesPage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/"
                element={
                    <ProtectedRoute>
                        <DashboardPage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/devices/:id"
                element={
                    <ProtectedRoute>
                        <DeviceDetailPage />
                    </ProtectedRoute>
                }
            />

        </Routes>
    );
}
