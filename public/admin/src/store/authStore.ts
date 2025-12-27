import { create } from "zustand";
import { saveToken, clearToken, getToken } from "@/utils/token";
import { verifySession } from "@/api/auth";

interface AuthState {
    token: string | null;
    user: any | null;
    loading: boolean;

    login: (token: string, user: any) => void;
    logout: () => void;
    restoreSession: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>((set) => ({
    token: getToken(),
    user: null,
    loading: true,

    login: (token, user) => {
        saveToken(token);
        set({ token, user });
    },

    logout: () => {
        clearToken();
        set({ token: null, user: null });
    },

    restoreSession: async () => {
        const token = getToken();
        if (!token) {
            set({ loading: false });
            return false;
        }

        try {
            const res = await verifySession();
            if (res?.success) {
                set({ token, user: res.user, loading: false });
                return true;
            }
        } catch (e) {
            clearToken();
        }

        set({ loading: false });
        return false;
    },
}));
