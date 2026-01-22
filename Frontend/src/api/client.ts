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

function getAccessToken(): string | null {
  return authStore.currentState.accessToken ?? localStorage.getItem("accessToken");
}

function forceLogoutAndRedirect(reason?: string) {
  console.warn(
    `[API Client] 401 Unauthorized${reason ? ` - ${reason}` : ""} - Clearing auth and redirecting to login`,
  );
  authStore.clearAuthentication();

  // Avoid redirect loops if already on /login
  if (window.location.pathname !== "/login") {
    window.location.href = "/login";
  }
}

api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const url: string = originalRequest?.url ?? "";
    const isAuthRequest = url.includes("/autenticacao/login") || url.includes("/autenticacao/refresh");

    const message: unknown = error?.response?.data?.message ?? error?.response?.data?.error;
    const msg = typeof message === "string" ? message.toLowerCase() : "";
    const backendSaysExpired = msg.includes("expir") || msg.includes("expired") || msg.includes("token invál") || msg.includes("invalid token");

    // If backend says the token is expired/invalid, force logoff and go to login.
    if (backendSaysExpired && !isAuthRequest) {
      forceLogoutAndRedirect("backend token invalid/expired");
      return Promise.reject(error);
    }

    // Handle 429 Too Many Requests (Rate Limit)
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers?.['retry-after']
        || error.response.headers?.['x-ratelimit-reset'];

      // Enhance error with rate limit information
      error.rateLimitInfo = {
        retryAfter: retryAfter ? parseInt(retryAfter, 10) : 60, // Default to 60 seconds
        message: typeof message === "string" ? message : "Muitas requisições. Por favor, aguarde antes de tentar novamente."
      };

      return Promise.reject(error);
    }

    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      // If this is an auth request (login/refresh), don't retry - just reject
      if (isAuthRequest) {
        return Promise.reject(error);
      }

      // Requirement: do NOT silently refresh tokens in the frontend.
      // If the access token expires, force the user to login again.
      forceLogoutAndRedirect("401 from API");
      return Promise.reject(error);
    }

    return Promise.reject(error);
  },
);


export function getErrorMessage(err: unknown, fallback = 'Erro inesperado'): string {
  if (!err) return fallback;

  const anyErr = err as any;
  const axiosMessage = anyErr?.response?.data?.message ?? anyErr?.response?.data?.error;
  if (typeof axiosMessage === 'string' && axiosMessage.trim()) return axiosMessage;

  if (typeof anyErr?.message === 'string' && anyErr.message.trim()) return anyErr.message;
  return fallback;
}

export default api;
