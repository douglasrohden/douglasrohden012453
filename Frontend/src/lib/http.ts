import axios, {
  type AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from "axios";
import { emitApiRateLimit } from "../api/apiRateLimitEvents";

export type RateLimitInfo = {
  retryAfter: number;
  message: string;
  limitPerWindow?: number;
  windowSeconds?: number;
  limitPerMinute?: number;
  remaining?: number;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

type HttpAuthAdapter = {
  getAccessToken(): string | null;
  getRefreshToken(): string | null;
  refreshTokens(): Promise<AuthTokens | null>;
  onTokensUpdated?(tokens: AuthTokens): void;
  onAuthFailure?(reason?: string): void;
};

let authAdapter: HttpAuthAdapter | null = null;

export function attachAuthAdapter(adapter: HttpAuthAdapter) {
  authAdapter = adapter;
}

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
  if (typeof retryAfter !== "number" || typeof message !== "string")
    return undefined;

  return {
    retryAfter,
    message,
    limitPerWindow:
      typeof info.limitPerWindow === "number" ? info.limitPerWindow : undefined,
    windowSeconds:
      typeof info.windowSeconds === "number" ? info.windowSeconds : undefined,
    limitPerMinute:
      typeof info.limitPerMinute === "number" ? info.limitPerMinute : undefined,
    remaining: typeof info.remaining === "number" ? info.remaining : undefined,
  };
}

export function getErrorMessage(
  err: unknown,
  fallback = "Erro inesperado",
): string {
  if (!err) return fallback;

  const rateLimitInfo = getRateLimitInfo(err);
  if (rateLimitInfo?.message) return rateLimitInfo.message;

  if (axios.isAxiosError(err)) {
    const data = err.response?.data;
    const obj = isRecord(data) ? data : {};
    const axiosMessage: unknown = obj?.message ?? obj?.error;
    if (typeof axiosMessage === "string" && axiosMessage.trim())
      return axiosMessage;
  }

  if (
    err instanceof Error &&
    typeof err.message === "string" &&
    err.message.trim()
  )
    return err.message;
  return fallback;
}

const API_HOST = import.meta.env.VITE_API_URL || "http://localhost:8080";
const BASE_URL = API_HOST.endsWith("/v1") ? API_HOST : `${API_HOST}/v1`;

export const rawHttp: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

const http: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

type QueueTask<T> = {
  fn: () => Promise<T>;
  resolve: (v: T) => void;
  reject: (e: unknown) => void;
};

const MAX_CONCURRENCY = 2;
const MIN_SPACING_MS = 400;
let lastStartMs = 0;
let active = 0;
let pauseUntil = 0;
const queue: Array<QueueTask<unknown>> = [];
const baseAdapter = http.defaults.adapter ?? axios.defaults.adapter;

function schedule<T>(fn: () => Promise<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    queue.push({
      fn,
      resolve: (v) => resolve(v as T),
      reject,
    });
    processQueue();
  });
}

function processQueue(): void {
  while (active < MAX_CONCURRENCY && queue.length > 0) {
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

    Promise.resolve()
      .then(task.fn)
      .then(task.resolve)
      .catch((err) => {
        const status = getHttpStatus(err);
        if (status === 429) {
          const info = axios.isAxiosError(err) ? parseRateLimit(err) : null;
          const retryAfter = info?.retryAfter;
          if (Number.isFinite(retryAfter) && (retryAfter as number) > 0) {
            pauseUntil = Math.max(
              pauseUntil,
              Date.now() + (retryAfter as number) * 1000,
            );
          }
        }
        task.reject(err);
      })
      .finally(() => {
        active -= 1;
        processQueue();
      });
  }
}

if (typeof baseAdapter === "function") {
  http.defaults.adapter = (config) => schedule(() => baseAdapter(config));
}

http.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = authAdapter?.getAccessToken();
    if (!config.headers) {
      config.headers = {} as any;
    }
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add X-Request-Id for tracing/log correlation (NOT for deduplication)
    const requestId =
      globalThis.crypto?.randomUUID?.() ??
      `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    config.headers["X-Request-Id"] = requestId;
    
    // Log in DEV for debugging
    if (import.meta.env.DEV) {
      console.log(
        `[HTTP] ${config.method?.toUpperCase()} ${config.url} [${requestId}]`,
      );
    }
    
    return config;
  },
  (error) => Promise.reject(error),
);

type ExtendedAxiosError = AxiosError & { rateLimitInfo?: RateLimitInfo };

function isAuthRequest(url?: string | null): boolean {
  if (!url) return false;
  return (
    url.includes("/autenticacao/login") || url.includes("/autenticacao/refresh")
  );
}

let refreshPromise: Promise<AuthTokens | null> | null = null;

async function tryRefreshTokens(): Promise<AuthTokens | null> {
  if (!authAdapter) return null;
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const tokens = await authAdapter.refreshTokens();
      if (tokens?.accessToken && tokens.refreshToken) {
        authAdapter.onTokensUpdated?.(tokens);
        return tokens;
      }
      return null;
    } catch {
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

function parseRateLimit(error: AxiosError): RateLimitInfo {
  const body = isRecord(error.response?.data) ? error.response?.data : {};
  const retryAfterHeader = error.response?.headers?.["retry-after"];
  const retryAfterFromHeader =
    typeof retryAfterHeader === "string"
      ? parseInt(retryAfterHeader, 10)
      : undefined;
  const retryAfterFromBody =
    typeof body?.retryAfter === "number"
      ? (body.retryAfter as number)
      : typeof body?.retryAfter === "string"
        ? parseInt(body.retryAfter as string, 10)
        : undefined;
  const retryAfterSeconds =
    Number.isFinite(retryAfterFromBody) && (retryAfterFromBody as number) > 0
      ? (retryAfterFromBody as number)
      : Number.isFinite(retryAfterFromHeader) &&
          (retryAfterFromHeader as number) > 0
        ? (retryAfterFromHeader as number)
        : 60;

  const limitHeader = error.response?.headers?.["x-rate-limit-limit"];
  const windowHeader = error.response?.headers?.["x-rate-limit-window-seconds"];
  const remainingHeader =
    error.response?.headers?.["x-rate-limit-remaining"];

  const limitFromHeader =
    typeof limitHeader === "string" ? parseInt(limitHeader, 10) : undefined;
  const windowSecondsFromHeader =
    typeof windowHeader === "string" ? parseInt(windowHeader, 10) : undefined;
  const remaining =
    typeof remainingHeader === "string"
      ? parseInt(remainingHeader, 10)
      : undefined;

  const limitFromBody =
    typeof body?.limit === "number" ? (body.limit as number) : undefined;
  const windowSecondsFromBody =
    typeof body?.windowSeconds === "number"
      ? (body.windowSeconds as number)
      : undefined;

  const limitPerWindow = Number.isFinite(limitFromBody)
    ? (limitFromBody as number)
    : limitFromHeader;
  const windowSeconds = Number.isFinite(windowSecondsFromBody)
    ? (windowSecondsFromBody as number)
    : windowSecondsFromHeader;
  const limitPerMinute =
    limitPerWindow && windowSeconds && windowSeconds > 0
      ? Math.round((limitPerWindow * 60) / windowSeconds)
      : undefined;
  const messageFromBody =
    typeof body?.message === "string" && (body.message as string).trim()
      ? (body.message as string)
      : undefined;
  const messageFromError =
    typeof error.message === "string" && error.message.trim()
      ? error.message
      : undefined;

  const message =
    messageFromBody ??
    messageFromError ??
    "Muitas requisi\u00e7\u00f5es. Aguarde antes de tentar novamente.";

  return {
    retryAfter: retryAfterSeconds,
    message,
    limitPerWindow,
    windowSeconds,
    limitPerMinute,
    remaining,
  };
}

http.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!axios.isAxiosError(error)) return Promise.reject(error);

    const originalRequest = error.config as typeof error.config & {
      _retry?: boolean;
    };
    const status = error.response?.status;
    const url: string | undefined = originalRequest?.url ?? undefined;

    if (status === 429) {
      const info = parseRateLimit(error);
      (error as ExtendedAxiosError).rateLimitInfo = info;

      if (Number.isFinite(info.retryAfter) && info.retryAfter > 0) {
        pauseUntil = Math.max(
          pauseUntil,
          Date.now() + info.retryAfter * 1000,
        );
      }

      if (!isAuthRequest(url)) {
        emitApiRateLimit({
          status: 429,
          message: info.message,
          retryAfterSeconds: info.retryAfter,
          limitPerWindow: info.limitPerWindow,
          windowSeconds: info.windowSeconds,
          limitPerMinute: info.limitPerMinute,
          remaining: info.remaining,
          endpoint: url,
          method: originalRequest?.method,
        });
      }

      return Promise.reject(error);
    }

    if (status === 401) {
      if (isAuthRequest(url)) {
        return Promise.reject(error);
      }

      if (originalRequest?._retry) {
        authAdapter?.onAuthFailure?.("401 after refresh attempt");
        return Promise.reject(error);
      }

      originalRequest._retry = true;
      const refreshed = await tryRefreshTokens();
      if (refreshed?.accessToken) {
        originalRequest.headers = originalRequest.headers ?? {};
        originalRequest.headers.Authorization = `Bearer ${refreshed.accessToken}`;
        return http(originalRequest);
      }

      authAdapter?.onAuthFailure?.("refresh failed");
      return Promise.reject(error);
    }

    return Promise.reject(error);
  },
);

export default http;
