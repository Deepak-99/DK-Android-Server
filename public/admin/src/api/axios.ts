//public/src/api/axios.ts

import axios, {
  AxiosInstance,
  InternalAxiosRequestConfig,
} from "axios";

import { disconnect } from "@/services/websocket";
import { getToken, setToken, clearToken } from "@/utils/token";

/* ---------------------------------------------------
   Create Axios Instance
--------------------------------------------------- */

const api: AxiosInstance = axios.create({
  baseURL: "http://localhost:3000/api",
  timeout: 30000,
  withCredentials: true // REQUIRED for refresh cookies
});

// Separate instance (no interceptors)
const rawAxios = axios.create({
  baseURL: "http://localhost:3000/api",
  withCredentials: true,
});

/* ---------------------------------------------------
   Error Normalizer
--------------------------------------------------- */

export const normalizeApiError = (err: any) => {
  if (!err.response) {
    return {
      type: "network",
      message: "Server unreachable. Please try again.",
    };
  }

  return {
    type: "api",
    status: err.response.status,
    message: err.response.data?.error || "Request failed",
  };
};

/* ---------------------------------------------------
   Request Interceptor (Attach Token)
--------------------------------------------------- */

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getToken();

    if (token) {
      config.headers = config.headers || {};
      config.headers["Authorization"] = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/* ---------------------------------------------------
   Response Interceptor (Handle 401 + Refresh)
--------------------------------------------------- */

let isRefreshing = false;
let pendingRequests: ((token: string) => void)[] = [];

api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      // 🔥 If already refreshing → queue requests
      if (isRefreshing) {
        return new Promise((resolve) => {
          pendingRequests.push((token: string) => {
            originalRequest.headers["Authorization"] = `Bearer ${token}`;
            resolve(api(originalRequest));
          });
        });
      }

      isRefreshing = true;

      try {
        // 🔥 Refresh token call
        const res = await rawAxios.post("/auth/refresh");

        const newToken = res.data.token;

        setToken(newToken);

        // Retry all pending requests
        pendingRequests.forEach((cb) => cb(newToken));
        pendingRequests = [];

        // Retry original request
        originalRequest.headers["Authorization"] = `Bearer ${newToken}`;

        return api(originalRequest);
      } catch (refreshError) {
        // 🔥 HARD LOGOUT
        clearToken();
        disconnect();

        window.location.href = "/login";

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;