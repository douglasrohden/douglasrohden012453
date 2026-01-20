import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/v1";

const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("accessToken");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor with robust refresh handling
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

        // Only handle 401 for non-auth requests
        if (error.response?.status === 401 && !originalRequest._retry && !isAuthRequest) {
            originalRequest._retry = true;
            const refreshToken = localStorage.getItem("refreshToken");

            if (!refreshToken) {
                // no refresh token — force logout
                localStorage.removeItem("accessToken");
                window.location.href = "/login";
                return Promise.reject(error);
            }

            // If a refresh is already in progress, queue the request
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    addRefreshSubscriber((token: string) => {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        resolve(api(originalRequest));
                    });
                });
            }

            isRefreshing = true;

            try {
                // Use raw axios to avoid triggering this interceptor
                const response = await axios.post(`${BASE_URL}/autenticacao/refresh`, {
                    refreshToken,
                }, { timeout: 5000 });

                const newAccessToken = response.data.accessToken;
                const newRefreshToken = response.data.refreshToken; // may be undefined if server doesn't rotate

                if (!newAccessToken) {
                    // Invalid refresh response — force logout
                    localStorage.removeItem("accessToken");
                    localStorage.removeItem("refreshToken");
                    window.location.href = "/login";
                    return Promise.reject(new Error('Invalid refresh response'));
                }

                localStorage.setItem("accessToken", newAccessToken);
                if (newRefreshToken) {
                    localStorage.setItem("refreshToken", newRefreshToken);
                }

                onRefreshed(newAccessToken);
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                return api(originalRequest);
            } catch (refreshError) {
                // Don't immediately redirect on transient network errors — clear tokens and send to login
                localStorage.removeItem("accessToken");
                localStorage.removeItem("refreshToken");
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
