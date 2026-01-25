import { rawHttp } from "../lib/http";

export interface LoginRequest {
  username: string;
  passwordHash: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export const authService = {
  login: async (username: string, password: string): Promise<LoginResponse> => {
    const response = await rawHttp.post("/autenticacao/login", {
      username,
      password,
    });
    return response.data;
  },

  refresh: async (refreshToken: string): Promise<LoginResponse> => {
    const response = await rawHttp.post("/autenticacao/refresh", {
      refreshToken,
    });
    return response.data;
  },
};
