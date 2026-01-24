export type ApiRateLimitEventDetail = {
  status: 429;
  message: string;
  retryAfterSeconds: number;
  limitPerWindow?: number;
  windowSeconds?: number;
  limitPerMinute?: number;
  remaining?: number;
  endpoint?: string;
  method?: string;
};

const EVENT_NAME = "api:rate-limit" as const;

export function emitApiRateLimit(detail: ApiRateLimitEventDetail): void {
  window.dispatchEvent(new CustomEvent<ApiRateLimitEventDetail>(EVENT_NAME, { detail }));
}

export function onApiRateLimit(handler: (detail: ApiRateLimitEventDetail) => void): () => void {
  const listener = (event: Event) => {
    const custom = event as CustomEvent<ApiRateLimitEventDetail>;
    if (custom?.detail) handler(custom.detail);
  };

  window.addEventListener(EVENT_NAME, listener);
  return () => window.removeEventListener(EVENT_NAME, listener);
}