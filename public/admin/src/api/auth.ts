import api from "./axios";

export interface LoginResponse {
    success: boolean;
    token: string;
    user: any;
}

export async function login(email: string, password: string) {
    const res = await api.post<LoginResponse>("/auth/login", {
        email,
        password,
    });
    return res.data;
}

export async function verifySession() {
    const res = await api.post<{ success: boolean; user: any }>("/auth/verify");
    return res.data;
}
