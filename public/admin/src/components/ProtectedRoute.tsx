import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import {JSX} from "react";

export default function ProtectedRoute({ children }: { children: JSX.Element }) {
    const token = useAuthStore((s: { token: any; }) => s.token);

    if (!token) return <Navigate to="/admin/login" replace />;

    return children;
}
