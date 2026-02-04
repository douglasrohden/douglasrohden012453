import axios from "axios";
import { isRecord } from "./utils";
import { getRateLimitInfo } from "./rateLimit";

export function getHttpStatus(err: unknown): number | undefined {
  if (axios.isAxiosError(err)) return err.response?.status;
  if (!isRecord(err)) return undefined;
  const resp = (err as Record<string, unknown>).response;
  if (!isRecord(resp)) return undefined;
  const status = resp.status;
  return typeof status === "number" ? status : undefined;
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
