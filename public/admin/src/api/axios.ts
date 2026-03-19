import axios, {
  AxiosInstance,
  InternalAxiosRequestConfig
} from "axios";

import { disconnect } from "../services/websocket";
import { getToken, setToken, clearToken } from "../utils/token";

/* ---------------------------------------------------
   Create Axios Instance (TYPED)
--------------------------------------------------- */

const api: AxiosInstance = axios.create({
  baseURL: "",
  timeout: 30000,
  withCredentials: true // REQUIRED for refresh cookies
});

// Raw axios instance (no interceptors)
const rawAxios = axios.create();

let isRefreshing = false;
let pendingRequests: ((token: string) => void)[] = [];

export const normalizeApiError = (err: any) => {
  if (!err.response) {
    return {
      type: "network",
      message: "Server unreachable. Please try again."
    };
  }

  return {
    type: "api",
    status: err.response.status,
    message: err.response.data?.message || "Request failed"
  };
};

/* ---------------------------------------------------
   Request Interceptor (Attach Token)
--------------------------------------------------- */

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getToken();

    if (token) {
      config.headers.set("Authorization", `Bearer ${token}`);
    }

    return config;
  },
  (error) => Promise.reject(error)
);


/* ---------------------------------------------------
   Response Interceptor (Refresh Token Logic)
--------------------------------------------------- */

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config;

    if (
      err.response?.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      if (!isRefreshing) {
        isRefreshing = true;

        try {
          const res = await rawAxios.post(
            "/auth/refresh",
            {},
            { withCredentials: true }
          );

          setToken(res.data.token);

          pendingRequests.forEach((cb) =>
            cb(res.data.token)
          );

          pendingRequests = [];
        } catch {
          clearToken();
          disconnect();
          window.location.href = "/login";
          return Promise.reject(err);
        } finally {
          isRefreshing = false;
        }
      }

      return new Promise((resolve) => {
        pendingRequests.push((token: string) => {
          originalRequest.headers.set(
            "Authorization",
            `Bearer ${token}`
          );
          resolve(api(originalRequest));
        });
      });
    }

    return Promise.reject(err);
  }
);

export default api;
