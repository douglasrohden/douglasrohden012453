import axios, { type AxiosError, type AxiosInstance } from "axios";
import { authStore } from "../store/auth.store";
import { emitApiRateLimit } from "./apiRateLimitEvents";
import { auth } from "../auth/auth.singleton";

type RateLimitInfo = {
  retryAfter: number;
  message: string;
  limitPerWindow?: number;
  windowSeconds?: number;
  // legacy support for older fields
  limitPerMinute?: number;
  remaining?: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function getHttpStatus(err: unknown): number | undefined {
  if (axios.isAxiosError(err)) return err.response?.status;
  if (!isRecord(err)) return undefined;
  const resp = (err as Record<string, unknown>).response;
  if (!isRecord(resp)) return undefined;
  const status = resp.status;
  return typeof status === "number" ? status : undefined;
}

export function getRateLimitInfo(err: unknown): RateLimitInfo | undefined {
  if (!isRecord(err)) return undefined;
  const info = (err as Record<string, unknown>).rateLimitInfo;
  if (!isRecord(info)) return undefined;
  const retryAfter = info.retryAfter;
  const message = info.message;
  if (typeof retryAfter !== "number" || typeof message !== "string") return undefined;
  const limitPerWindow = typeof info.limitPerWindow === "number" ? info.limitPerWindow : undefined;
  const windowSeconds = typeof info.windowSeconds === "number" ? info.windowSeconds : undefined;
  const limitPerMinute = typeof info.limitPerMinute === "number" ? info.limitPerMinute : undefined;
  const remaining = typeof info.remaining === "number" ? info.remaining : undefined;
  return { retryAfter, message, limitPerWindow, windowSeconds, limitPerMinute, remaining };
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
  auth.logout("/login");
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
      const windowHeader = error.response.headers?.["x-rate-limit-window-seconds"];
      const remainingHeader = error.response.headers?.["x-rate-limit-remaining"];

      const limitFromHeader = typeof limitHeader === "string" ? parseInt(limitHeader, 10) : undefined;
      const windowSecondsFromHeader = typeof windowHeader === "string" ? parseInt(windowHeader, 10) : undefined;
      const limitFromBody = typeof body?.limit === "number" ? (body.limit as number) : undefined;
      const windowSecondsFromBody = typeof body?.windowSeconds === "number" ? (body.windowSeconds as number) : undefined;

      const limitPerWindow = Number.isFinite(limitFromBody) ? (limitFromBody as number) : limitFromHeader;
      const windowSeconds = Number.isFinite(windowSecondsFromBody)
        ? (windowSecondsFromBody as number)
        : windowSecondsFromHeader;
      const limitPerMinute =
        limitPerWindow && windowSeconds && windowSeconds > 0
          ? Math.round((limitPerWindow * 60) / windowSeconds)
          : undefined;
      const remaining = typeof remainingHeader === "string" ? parseInt(remainingHeader, 10) : undefined;

      const friendlyMessage =
        typeof body?.message === "string" && (body.message as string).trim()
          ? (body.message as string)
          : typeof message === "string" && message.trim()
            ? message
            : "Muitas requisições. Por favor, aguarde antes de tentar novamente.";

      // Enhance error with rate limit information
      const info: RateLimitInfo = {
        retryAfter: retryAfterSeconds,
        message: friendlyMessage,
        limitPerWindow,
        windowSeconds,
        limitPerMinute,
        remaining,
      };

      (error as AxiosError & { rateLimitInfo?: RateLimitInfo }).rateLimitInfo = info;

      // Global toast/event for all screens (avoid duplicating on login/refresh page)
      if (!isAuthRequest) {
        emitApiRateLimit({
          status: 429,
          message: friendlyMessage,
          retryAfterSeconds,
          limitPerWindow,
          windowSeconds,
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
      // If this is an auth request (login/refresh), don't redirect - just reject
      if (isAuthRequest) {
        return Promise.reject(error);
      }

      // Edital: o access token expira (5 min). Ao expirar, deve fazer logoff e forçar novo login.
      // Não fazer renovação automática de token no frontend.
      forceLogoutAndRedirect("401 unauthorized (token expired/invalid)");
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
