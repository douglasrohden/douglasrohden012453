import axios, { type AxiosInstance } from "axios";
import { authStore } from "../store/auth.store";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/v1";

export const rawApi: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = authStore.currentState.accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

function onRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

function addRefreshSubscriber(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const url: string = originalRequest?.url ?? "";
    const isAuthRequest = url.includes("/autenticacao/login") || url.includes("/autenticacao/refresh");

    const message: unknown = error?.response?.data?.message ?? error?.response?.data?.error;
    const msg = typeof message === "string" ? message.toLowerCase() : "";
    const backendSaysExpired = msg.includes("expir") || msg.includes("expired") || msg.includes("token invál") || msg.includes("invalid token");

    // Helper function to force logout and redirect
    const forceLogoutAndRedirect = () => {
      console.warn("[API Client] 401 Unauthorized - Clearing auth and redirecting to login");
      authStore.clearAuthentication();
      window.location.href = "/login";
    };

    // If backend says the token is expired/invalid, force logoff and go to login.
    if (backendSaysExpired && !isAuthRequest) {
      forceLogoutAndRedirect();
      return Promise.reject(error);
    }

    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      // If this is an auth request (login/refresh), don't retry - just reject
      if (isAuthRequest) {
        return Promise.reject(error);
      }

      // If already retried, force logout
      if (originalRequest._retry) {
        forceLogoutAndRedirect();
        return Promise.reject(error);
      }

      originalRequest._retry = true;
      const refreshToken = authStore.currentState.refreshToken;

      // No refresh token available - force logout
      if (!refreshToken) {
        forceLogoutAndRedirect();
        return Promise.reject(error);
      }

      // If already refreshing, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          addRefreshSubscriber((token: string) => {
            if (token) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(api(originalRequest));
            } else {
              reject(error);
            }
          });
        });
      }

      isRefreshing = true;

      try {
        const response = await rawApi.post(
          "/autenticacao/refresh",
          { refreshToken },
          { timeout: 5000 },
        );

        const newAccessToken = response.data.accessToken as string | undefined;
        const newRefreshToken = response.data.refreshToken as string | undefined;

        if (!newAccessToken) {
          forceLogoutAndRedirect();
          return Promise.reject(new Error("Invalid refresh response"));
        }

        authStore.setState({
          isAuthenticated: true,
          accessToken: newAccessToken,
          refreshToken: newRefreshToken ?? refreshToken,
        });

        onRefreshed(newAccessToken);
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed - force logout and redirect
        forceLogoutAndRedirect();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default api;
