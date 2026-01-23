import { BaseStore } from "./base.store";

export type ApiRateLimitNotification = {
  status: 429;
  message: string;
  retryAfterSeconds: number;
  limitPerMinute?: number;
  remaining?: number;
  endpoint?: string;
  method?: string;
  at: number;
};

type ApiState = {
  lastRateLimit: ApiRateLimitNotification | null;
};

const initialState: ApiState = {
  lastRateLimit: null,
};

class ApiStore extends BaseStore<ApiState> {
  constructor() {
    super(initialState);
  }

  emitRateLimit(detail: Omit<ApiRateLimitNotification, "at">): void {
    this.setState({
      lastRateLimit: {
        ...detail,
        at: Date.now(),
      },
    });
  }

  reset(): void {
    this.setState(initialState);
  }
}

export const apiStore = new ApiStore();
