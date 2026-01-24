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
  const { addToast, updateToast, removeToast } = useToast();
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

      // Clear previous toast if still present to avoid stacking overlays
      if (currentToastIdRef.current && removeToast) {
        removeToast(currentToastIdRef.current);
        currentToastIdRef.current = null;
      }

      const limitText = (() => {
        if (Number.isFinite(detail.limitPerWindow) && Number.isFinite(detail.windowSeconds)) {
          return ` (limite: ${detail.limitPerWindow}/${detail.windowSeconds}s)`;
        }
        if (Number.isFinite(detail.limitPerMinute)) {
          return ` (limite: ${detail.limitPerMinute}/min)`;
        }
        return "";
      })();

      // Extract base message, removing any existing time information from backend
      let msgBase = detail.message?.trim() || "Muitas requisições.";

      // Remove qualquer informação de tempo que o backend possa ter incluído
      msgBase = msgBase.replace(/Tente novamente em \d+[smh]+\.?/i, "").trim();
      msgBase = msgBase.replace(/\.$/, ""); // Remove trailing period if exists

      let remainingSeconds = detail.retryAfterSeconds;

      const buildMessage = (seconds: number) => {
        const retryText = formatRetryAfter(seconds);
        return `${msgBase} Tente novamente em ${retryText}.${limitText}`;
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
          if (toastId && removeToast) {
            removeToast(toastId);
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
