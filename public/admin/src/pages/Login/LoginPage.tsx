import { useState } from "react";
import { login } from "@/api/auth";
import { useAuthStore } from "@/store/authStore";

export default function LoginPage() {
    const auth = useAuthStore();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        try {
            setLoading(true);
            setError("");

            const res = await login(email, password);

            if (!res.success || !res.token) {
                setError("Invalid credentials");
                setLoading(false);
                return;
            }

            auth.login(res.token, res.user);

            window.location.href = "/admin";
        } catch (err: any) {
            setError(err?.response?.data?.error || "Login failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center h-screen bg-bg">
            <div className="bg-card p-8 rounded-xl shadow-xl w-96">
                <h1 className="text-2xl font-bold mb-6">Hawkshaw Admin</h1>

                <input
                    className="w-full p-3 mb-3 rounded bg-bg border border-border"
                    placeholder="Email"
                    onChange={(e) => setEmail(e.target.value)}
                />

                <input
                    className="w-full p-3 mb-3 rounded bg-bg border border-border"
                    type="password"
                    placeholder="Password"
                    onChange={(e) => setPassword(e.target.value)}
                />

                {error && <p className="text-red-400 mb-3">{error}</p>}

                <button
                    onClick={handleLogin}
                    disabled={loading}
                    className="w-full bg-accent text-white p-3 rounded hover:opacity-90"
                >
                    {loading ? "Logging in..." : "Login"}
                </button>
            </div>
        </div>
    );
}
