import { rawHttp } from "../lib/http";

export interface LoginResponse {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
}

export const authService = {
  login: async (username: string, password: string): Promise<LoginResponse> => {
    const response = await rawHttp.post(
      "/autenticacao/login",
      { username, password },
      { withCredentials: true },
    );
    return response.data;
  },

  refresh: async (): Promise<LoginResponse> => {
    const response = await rawHttp.post(
      "/autenticacao/refresh",
      {},
      { withCredentials: true },
    );
    return response.data;
  },
};
