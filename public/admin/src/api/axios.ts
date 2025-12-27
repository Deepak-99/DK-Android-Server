import axios from "axios";
import { useAuthStore } from "@/store/authStore";

const api = axios.create({
    baseURL: "/", // Using your no-prefix setup: /auth/login, /devices, etc.
    withCredentials: false
});

// Add token to headers
api.interceptors.request.use((config) => {
    const token = useAuthStore.getState().token;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Auto-logout on 401
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error?.response?.status;

        if (status === 401) {
            useAuthStore.getState().logout();
            window.location.href = "/admin/login";
        }

        return Promise.reject(error);
    }
);

export default api;
