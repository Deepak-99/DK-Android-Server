import axios from "axios";
import { getToken, clearToken } from "@/utils/token";

const api = axios.create({
  baseURL: "http://localhost:3000/api",
  timeout: 30000
});

/* -----------------------------
   REQUEST INTERCEPTOR
----------------------------- */
api.interceptors.request.use((config) => {
  const token = getToken();   // ✅ FIXED (was localStorage.getItem)

  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

/* -----------------------------
   RESPONSE INTERCEPTOR
----------------------------- */
api.interceptors.response.use(
    (res) => res,
    (error) => {

        if (error.response?.status === 401) {

            // prevent redirect loop
            if (window.location.pathname !== "/login") {
                clearToken();
                window.location.replace("/login");
            }
        }

        return Promise.reject(error);
    }
);

export default api;