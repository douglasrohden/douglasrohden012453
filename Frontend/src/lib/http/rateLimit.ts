import type { AxiosError } from "axios";
import { isRecord } from "./utils";

export type RateLimitInfo = {
  retryAfter: number;
  message: string;
  limitPerWindow?: number;
  windowSeconds?: number;
  limitPerMinute?: number;
  remaining?: number;
};

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

export function parseRateLimit(error: AxiosError): RateLimitInfo {
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
  const remainingHeader = error.response?.headers?.["x-rate-limit-remaining"];

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
    "Muitas requisições. Aguarde antes de tentar novamente.";

  return {
    retryAfter: retryAfterSeconds,
    message,
    limitPerWindow,
    windowSeconds,
    limitPerMinute,
    remaining,
  };
}
