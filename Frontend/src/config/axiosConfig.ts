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

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Never try to refresh while logging in or refreshing (prevents loops)
        const url: string = originalRequest?.url ?? "";
        const isAuthRequest = url.includes("/autenticacao/login") || url.includes("/autenticacao/refresh");

        if (error.response?.status === 401 && !originalRequest._retry && !isAuthRequest) {
            originalRequest._retry = true;
            const refreshToken = localStorage.getItem("refreshToken");

            if (refreshToken) {
                try {
                    const response = await axios.post(`${BASE_URL}/autenticacao/refresh`, {
                        refreshToken,
                    });

                    const newAccessToken = response.data.accessToken;
                    localStorage.setItem("accessToken", newAccessToken);

                    originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                    return api(originalRequest);
                } catch {
                    // If refresh fails, logout user
                    localStorage.removeItem("accessToken");
                    localStorage.removeItem("refreshToken");
                    window.location.href = "/login";
                }
            } else {
                window.location.href = "/login";
            }
        }
        return Promise.reject(error);
    }
);

export default api;
