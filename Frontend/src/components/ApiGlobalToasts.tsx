import { useEffect, useRef } from "react";
import { onApiRateLimit, type ApiRateLimitEventDetail } from "../api/apiEvents";
import { useToast } from "../contexts/ToastContext";

function formatRetryAfter(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return "alguns segundos";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return mins > 0 ? `${mins}m ${secs.toString().padStart(2, "0")}s` : `${secs}s`;
}

export function ApiGlobalToasts() {
  const { addToast } = useToast();
  const lastToastAtRef = useRef<number>(0);
  const lastToastKeyRef = useRef<string>("");

  useEffect(() => {
    return onApiRateLimit((detail: ApiRateLimitEventDetail) => {
      // Basic de-dupe so a burst of requests doesn't spam the user.
      const now = Date.now();
      const key = `${detail.endpoint ?? ""}|${detail.method ?? ""}|${detail.retryAfterSeconds}|${detail.message}`;
      if (key === lastToastKeyRef.current && now - lastToastAtRef.current < 1500) return;

      lastToastKeyRef.current = key;
      lastToastAtRef.current = now;

      const retryText = formatRetryAfter(detail.retryAfterSeconds);

      const limitText =
        Number.isFinite(detail.limitPerMinute) && (detail.limitPerMinute as number) > 0
          ? ` (limite: ${detail.limitPerMinute}/min)`
          : "";
      const remainingText =
        Number.isFinite(detail.remaining) && (detail.remaining as number) >= 0
          ? ` (restante: ${detail.remaining})`
          : "";

      const msgBase = detail.message?.trim()
        ? detail.message
        : "Muitas requisições.";

      // Check if message already contains retry time info to avoid duplication
      const alreadyHasRetryInfo = msgBase.toLowerCase().includes("tente novamente em") ||
        msgBase.toLowerCase().includes("aguarde");

      const msg = alreadyHasRetryInfo
        ? `${msgBase}${limitText}${remainingText}`
        : `${msgBase}${limitText}${remainingText} (tente novamente em ${retryText})`;

      addToast(msg, "warning");
    });
  }, [addToast]);

  return null;
}
