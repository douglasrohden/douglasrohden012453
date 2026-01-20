import api from "../config/axiosConfig";

export interface LoginRequest {
    username: string;
    passwordHash: string; // The API expects 'password', adapted below
}

export interface LoginResponse {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}

export const authService = {
    login: async (username: string, password: string): Promise<LoginResponse> => {
        const response = await api.post("/autenticacao/login", { username, password });
        if (response.data.accessToken) {
            localStorage.setItem("accessToken", response.data.accessToken);
            localStorage.setItem("refreshToken", response.data.refreshToken);
            localStorage.setItem("user", username);
        }
        return response.data;
    },

    refresh: async (refreshToken: string): Promise<LoginResponse> => {
        // Use raw axios base URL to avoid interceptors
        const resp = await api.post("/autenticacao/refresh", { refreshToken });
        if (resp.data.accessToken) {
            localStorage.setItem("accessToken", resp.data.accessToken);
            if (resp.data.refreshToken) {
                localStorage.setItem("refreshToken", resp.data.refreshToken);
            }
        }
        return resp.data;
    },

    logout: () => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        window.location.href = "/login";
    },

    getCurrentUser: () => {
        return localStorage.getItem("user");
    },

    isAuthenticated: () => {
        return !!localStorage.getItem("accessToken");
    },
};
