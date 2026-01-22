import axios, { type AxiosError, type AxiosInstance } from "axios";
import { authStore } from "../store/auth.store";
import { emitApiRateLimit } from "./apiEvents";

type RateLimitInfo = {
  retryAfter: number;
  message: string;
  limitPerMinute?: number;
  remaining?: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

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
  async (error: unknown) => {
    if (!axios.isAxiosError(error)) return Promise.reject(error);

    const originalRequest = error.config;
    const url: string = originalRequest?.url ?? "";
    const isAuthRequest = url.includes("/autenticacao/login") || url.includes("/autenticacao/refresh");

    const responseData = error.response?.data;
    const body = isRecord(responseData) ? responseData : {};
    const message: unknown = body?.message ?? body?.error;
    const msg = typeof message === "string" ? message.toLowerCase() : "";
    const backendSaysExpired = msg.includes("expir") || msg.includes("expired") || msg.includes("token invál") || msg.includes("invalid token");

    // If backend says the token is expired/invalid, force logoff and go to login.
    if (backendSaysExpired && !isAuthRequest) {
      forceLogoutAndRedirect("backend token invalid/expired");
      return Promise.reject(error);
    }

    // Handle 429 Too Many Requests (Rate Limit)
    if (error.response?.status === 429) {
      const retryAfterFromBody =
        typeof body?.retryAfter === "number"
          ? (body.retryAfter as number)
          : typeof body?.retryAfter === "string"
            ? parseInt(body.retryAfter as string, 10)
            : undefined;

      const retryAfterHeader = error.response.headers?.["retry-after"];
      const retryAfterFromHeader =
        typeof retryAfterHeader === "string" ? parseInt(retryAfterHeader, 10) : undefined;

      const retryAfterSeconds =
        Number.isFinite(retryAfterFromBody) && (retryAfterFromBody as number) > 0
          ? (retryAfterFromBody as number)
          : Number.isFinite(retryAfterFromHeader) && (retryAfterFromHeader as number) > 0
            ? (retryAfterFromHeader as number)
            : 60;

      const limitHeader = error.response.headers?.["x-rate-limit-limit"];
      const remainingHeader = error.response.headers?.["x-rate-limit-remaining"];
      const limitPerMinute = typeof limitHeader === "string" ? parseInt(limitHeader, 10) : undefined;
      const remaining = typeof remainingHeader === "string" ? parseInt(remainingHeader, 10) : undefined;

      const friendlyMessage =
        typeof body?.message === "string" && (body.message as string).trim()
          ? (body.message as string)
          : typeof message === "string" && message.trim()
            ? message
            : "Muitas requisições. Por favor, aguarde antes de tentar novamente.";

      // Enhance error with rate limit information
      (error as AxiosError & { rateLimitInfo?: RateLimitInfo }).rateLimitInfo = {
        retryAfter: retryAfterSeconds,
        message: friendlyMessage,
        limitPerMinute,
        remaining,
      };

      // Global toast/event for all screens (avoid duplicating on login/refresh page)
      if (!isAuthRequest) {
        emitApiRateLimit({
          status: 429,
          message: friendlyMessage,
          retryAfterSeconds,
          limitPerMinute,
          remaining,
          endpoint: url,
          method: originalRequest?.method,
        });
      }

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

  const rateLimitInfo: RateLimitInfo | undefined =
    isRecord(err) && isRecord((err as Record<string, unknown>).rateLimitInfo)
      ? ((err as Record<string, unknown>).rateLimitInfo as RateLimitInfo)
      : undefined;
  if (rateLimitInfo?.message && typeof rateLimitInfo.message === "string") {
    // Return the message as-is; toast/UI components handle retry time display
    return rateLimitInfo.message;
  }

  if (axios.isAxiosError(err)) {
    const data = err.response?.data;
    const obj = isRecord(data) ? data : {};
    const axiosMessage: unknown = obj?.message ?? obj?.error;
    if (typeof axiosMessage === 'string' && axiosMessage.trim()) return axiosMessage;
  }

  if (err instanceof Error && typeof err.message === 'string' && err.message.trim()) return err.message;
  return fallback;
}

export default api;
