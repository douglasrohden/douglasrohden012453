import { useEffect, useRef } from "react";
import { onApiRateLimit, type ApiRateLimitEventDetail } from "../api/apiRateLimitEvents";
import { useToast } from "../contexts/ToastContext";

function formatRetryAfter(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return "alguns segundos";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return mins > 0 ? `${mins}m ${secs.toString().padStart(2, "0")}s` : `${secs}s`;
}

export function ApiGlobalToasts() {
  const { addToast, updateToast } = useToast();
  const lastToastAtRef = useRef<number>(0);
  const lastToastKeyRef = useRef<string>("");
  const countdownIntervalRef = useRef<number | null>(null);
  const currentToastIdRef = useRef<string | null>(null);

  useEffect(() => {
    return onApiRateLimit((detail: ApiRateLimitEventDetail) => {
      // Basic de-dupe so a burst of requests doesn't spam the user.
      const now = Date.now();
      const key = `${detail.endpoint ?? ""}|${detail.method ?? ""}|${detail.retryAfterSeconds}|${detail.message}`;
      if (key === lastToastKeyRef.current && now - lastToastAtRef.current < 1500) return;

      lastToastKeyRef.current = key;
      lastToastAtRef.current = now;

      // Clear any previous countdown
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }

      const limitText =
        Number.isFinite(detail.limitPerMinute) && (detail.limitPerMinute as number) > 0
          ? ` (limite: ${detail.limitPerMinute}/min)`
          : "";

      const msgBase = detail.message?.trim()
        ? detail.message
        : "Muitas requisições.";

      // Check if message already contains retry time info to avoid duplication
      const alreadyHasRetryInfo = msgBase.toLowerCase().includes("tente novamente em") ||
        msgBase.toLowerCase().includes("aguarde");

      let remainingSeconds = detail.retryAfterSeconds;

      const buildMessage = (seconds: number) => {
        const retryText = formatRetryAfter(seconds);
        return alreadyHasRetryInfo
          ? `${msgBase}${limitText}`
          : `${msgBase} Tente novamente em ${retryText}.${limitText}`;
      };

      const initialMsg = buildMessage(remainingSeconds);
      const toastId = addToast(initialMsg, "warning", 0); // Duration 0 means it won't auto-dismiss
      currentToastIdRef.current = toastId;

      // Start countdown
      countdownIntervalRef.current = window.setInterval(() => {
        remainingSeconds--;

        if (remainingSeconds <= 0) {
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
          }
          currentToastIdRef.current = null;
          return;
        }

        const updatedMsg = buildMessage(remainingSeconds);
        if (toastId && updateToast) {
          updateToast(toastId, updatedMsg);
        }
      }, 1000);
    });
  }, [addToast, updateToast]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, []);

  return null;
}
