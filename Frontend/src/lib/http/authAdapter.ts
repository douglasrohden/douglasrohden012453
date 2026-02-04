export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type HttpAuthAdapter = {
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

export function getAuthAdapter(): HttpAuthAdapter | null {
  return authAdapter;
}
