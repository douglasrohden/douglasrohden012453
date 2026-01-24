let currentActionId: string | null = null;
let currentActionAtMs = 0;

const DEFAULT_TTL_MS = 5000;

function uuid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // Fallback (not cryptographically strong, but good enough for request correlation)
  return `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`;
}

export function recordUserAction(): string {
  currentActionId = uuid();
  currentActionAtMs = Date.now();
  return currentActionId;
}

export function getCurrentUserActionId(ttlMs: number = DEFAULT_TTL_MS): string | null {
  if (!currentActionId) return null;
  const age = Date.now() - currentActionAtMs;
  if (age < 0 || age > ttlMs) return null;
  return currentActionId;
}
