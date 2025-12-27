import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";

export default function ProtectedRoute({ children }: { children: JSX.Element }) {
    const token = useAuthStore((s) => s.token);

    if (!token) return <Navigate to="/admin/login" replace />;

    return children;
}
