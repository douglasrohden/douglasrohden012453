import axios, {
  type AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from "axios";
import { emitApiRateLimit } from "../../api/apiRateLimitEvents";
import { getAuthAdapter, type AuthTokens } from "./authAdapter";
import { getHttpStatus } from "./errorUtils";
import { parseRateLimit, type RateLimitInfo } from "./rateLimit";

const API_HOST = import.meta.env.VITE_API_URL || "http://localhost:8080";
const BASE_URL = API_HOST.endsWith("/v1") ? API_HOST : `${API_HOST}/v1`;

export const rawHttp: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

const http: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
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
    const token = getAuthAdapter()?.getAccessToken();
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
  const authAdapter = getAuthAdapter();
  if (!authAdapter) return null;
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const tokens = await authAdapter.refreshTokens();
      if (tokens?.accessToken) {
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
        getAuthAdapter()?.onAuthFailure?.("401 after refresh attempt");
        return Promise.reject(error);
      }

      originalRequest._retry = true;
      const refreshed = await tryRefreshTokens();
      if (refreshed?.accessToken) {
        originalRequest.headers = originalRequest.headers ?? {};
        originalRequest.headers.Authorization = `Bearer ${refreshed.accessToken}`;
        return http(originalRequest);
      }

      getAuthAdapter()?.onAuthFailure?.("refresh failed");
      return Promise.reject(error);
    }

    return Promise.reject(error);
  },
);

export default http;
