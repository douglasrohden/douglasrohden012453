import { rawApi } from "../api/client";

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
    const response = await rawApi.post("/autenticacao/login", {
      username,
      password,
    });
    return response.data as LoginResponse;
  },

  refresh: async (refreshToken: string): Promise<LoginResponse> => {
    const resp = await rawApi.post("/autenticacao/refresh", { refreshToken });
    return resp.data as LoginResponse;
  },

  logout: () => {},

  getCurrentUser: () => {
    return localStorage.getItem("user");
  },

  isAuthenticated: () => {
    return !!localStorage.getItem("accessToken");
  },
};
