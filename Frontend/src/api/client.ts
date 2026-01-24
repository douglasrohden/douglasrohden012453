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

// Request queue with low concurrency and backoff on 429
type QueueTask<T = unknown> = { fn: () => Promise<T>; resolve: (v: T) => void; reject: (e: unknown) => void };
const MAX_CONCURRENCY = 2;
const MIN_SPACING_MS = 400;
let lastStartMs = 0;
let active = 0;
let pauseUntil = 0;
const queue: QueueTask[] = [];

const baseAdapter = api.defaults.adapter ?? axios.defaults.adapter;

function schedule<T>(fn: () => Promise<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    queue.push({ fn, resolve, reject });
    processQueue();
  });
}

function processQueue(): void {
  if (active >= MAX_CONCURRENCY) return;
  if (queue.length === 0) return;

  const now = Date.now();
  if (now < pauseUntil) {
    setTimeout(processQueue, pauseUntil - now);
    return;
  }

  const sinceLast = now - lastStartMs;
  if (sinceLast < MIN_SPACING_MS) {
    setTimeout(processQueue, MIN_SPACING_MS - sinceLast);
    return;
  }

  const task = queue.shift();
  if (!task) return;

  active += 1;
  lastStartMs = Date.now();

  task.fn()
    .then(task.resolve)
    .catch((err) => {
      const status = getHttpStatus(err);
      if (status === 429) {
        const retryAfterHeader = err?.response?.headers?.["retry-after"];
        const retryAfter = typeof retryAfterHeader === "string" ? parseInt(retryAfterHeader, 10) : undefined;
        if (Number.isFinite(retryAfter) && retryAfter! > 0) {
          pauseUntil = Date.now() + retryAfter! * 1000;
        }
      }
      task.reject(err);
    })
    .finally(() => {
      active -= 1;
      processQueue();
    });
}

if (typeof baseAdapter === 'function') {
  api.defaults.adapter = (config) => schedule(() => baseAdapter(config));
}

type RefreshResponse = {
  accessToken: string;
  refreshToken: string;
  expiresIn?: number;
};

let refreshPromise: Promise<boolean> | null = null;

async function tryRefreshToken(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const refreshToken = authStore.currentState.refreshToken ?? localStorage.getItem("refreshToken");
    const user = authStore.currentState.user ?? localStorage.getItem("user");
    if (!refreshToken || !user) return false;

    try {
      const resp = await rawApi.post("/autenticacao/refresh", { refreshToken });
      const data = resp.data as Partial<RefreshResponse>;
      if (!data?.accessToken || !data?.refreshToken) return false;
      authStore.setAuthenticated(data.accessToken, data.refreshToken, user);
      return true;
    } catch {
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

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
    const backendSaysExpired =
      msg.includes("expir") ||
      msg.includes("expired") ||
      msg.includes("token invál") ||
      msg.includes("invalid token");

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

      // Fluxo esperado: ao expirar/401, tentar refresh UMA vez e repetir a requisição.
      // Se falhar, desloga e redireciona para /login (sem loops).
      const req = (originalRequest ?? {}) as typeof originalRequest & { _retry?: boolean };
      if (req._retry) {
        forceLogoutAndRedirect(
          backendSaysExpired ? "401 after refresh attempt (expired/invalid)" : "401 after refresh attempt",
        );
        return Promise.reject(error);
      }

      req._retry = true;

      const refreshed = await tryRefreshToken();
      if (refreshed) {
        return api(req);
      }

      forceLogoutAndRedirect(
        backendSaysExpired ? "refresh failed (expired/invalid)" : "refresh failed",
      );
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
