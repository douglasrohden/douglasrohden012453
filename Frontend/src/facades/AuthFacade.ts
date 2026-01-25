import { BehaviorSubject } from "rxjs";
import {
  attachAuthAdapter,
  type AuthTokens,
  getErrorMessage,
} from "../lib/http";
import { authService, type LoginResponse } from "../services/authService";

type AuthUser = {
  username: string;
};

const STORAGE_KEYS = {
  accessToken: "accessToken",
  refreshToken: "refreshToken",
  user: "user",
  expiresAt: "accessTokenExpiresAt",
} as const;

const REFRESH_MARGIN_MS = 60_000; // refresh 1 min before expiry
const DEFAULT_EXPIRES_SECONDS = 5 * 60;

class AuthFacade {
  readonly accessToken$ = new BehaviorSubject<string | null>(null);
  readonly refreshToken$ = new BehaviorSubject<string | null>(null);
  readonly user$ = new BehaviorSubject<AuthUser | null>(null);
  readonly isAuthenticated$ = new BehaviorSubject<boolean>(false);
  readonly loading$ = new BehaviorSubject<boolean>(false);
  readonly error$ = new BehaviorSubject<string | null>(null);
  readonly initialized$ = new BehaviorSubject<boolean>(false);

  private refreshTimeout: number | null = null;
  private refreshPromise: Promise<AuthTokens | null> | null = null;

  constructor() {
    attachAuthAdapter({
      getAccessToken: () => this.accessToken$.getValue(),
      getRefreshToken: () => this.refreshToken$.getValue(),
      refreshTokens: () => this.refreshTokens(),
      onAuthFailure: () => this.logout(),
    });
  }

  async init(): Promise<void> {
    if (this.initialized$.getValue()) return;
    this.loading$.next(true);
    this.error$.next(null);

    const stored = this.readStoredSession();

    if (stored.accessToken && stored.user) {
      this.applySession(
        stored.accessToken,
        stored.refreshToken ?? null,
        stored.user,
        stored.expiresAtMs,
        { silentLoading: true },
      );
      if (
        stored.refreshToken &&
        stored.expiresAtMs &&
        stored.expiresAtMs - Date.now() <= REFRESH_MARGIN_MS
      ) {
        await this.refreshTokens();
      }
    } else if (stored.refreshToken && stored.user) {
      await this.refreshTokens();
    }

    this.loading$.next(false);
    this.initialized$.next(true);
  }

  async login(username: string, password: string): Promise<boolean> {
    this.loading$.next(true);
    this.error$.next(null);

    try {
      const data: LoginResponse = await authService.login(username, password);
      this.applySession(data.accessToken, data.refreshToken, { username }, null, {
        expiresInSeconds: data.expiresIn,
      });
      this.initialized$.next(true);
      return true;
    } catch (err: unknown) {
      const message = getErrorMessage(err, "Falha ao autenticar");
      this.error$.next(message);
      this.clearSession();
      return false;
    } finally {
      this.loading$.next(false);
    }
  }

  logout(): void {
    this.clearSession();
    this.initialized$.next(true);
  }

  private clearSession() {
    this.clearRefreshTimer();
    this.accessToken$.next(null);
    this.refreshToken$.next(null);
    this.user$.next(null);
    this.isAuthenticated$.next(false);
    this.error$.next(null);

    localStorage.removeItem(STORAGE_KEYS.accessToken);
    localStorage.removeItem(STORAGE_KEYS.refreshToken);
    localStorage.removeItem(STORAGE_KEYS.user);
    localStorage.removeItem(STORAGE_KEYS.expiresAt);
  }

  private readStoredUser(): AuthUser | null {
    const user = localStorage.getItem(STORAGE_KEYS.user);
    if (!user) return null;
    return { username: user };
  }

  private readStoredSession(): {
    accessToken: string | null;
    refreshToken: string | null;
    user: AuthUser | null;
    expiresAtMs: number | null;
  } {
    const accessToken = localStorage.getItem(STORAGE_KEYS.accessToken);
    const refreshToken = localStorage.getItem(STORAGE_KEYS.refreshToken);
    const user = this.readStoredUser();
    const expiresAtRaw = localStorage.getItem(STORAGE_KEYS.expiresAt);
    const expiresAtMs = expiresAtRaw ? Number(expiresAtRaw) : null;

    return {
      accessToken,
      refreshToken,
      user,
      expiresAtMs: Number.isFinite(expiresAtMs) ? (expiresAtMs as number) : null,
    };
  }

  private applySession(
    accessToken: string,
    refreshToken: string | null,
    user: AuthUser,
    expiresAtMs?: number | null,
    opts?: { expiresInSeconds?: number; silentLoading?: boolean },
  ) {
    if (!opts?.silentLoading) {
      this.loading$.next(false);
    }

    const nextExpiresAtMs =
      expiresAtMs ??
      (opts?.expiresInSeconds
        ? Date.now() + opts.expiresInSeconds * 1000
        : Date.now() + DEFAULT_EXPIRES_SECONDS * 1000);

    this.accessToken$.next(accessToken);
    this.refreshToken$.next(refreshToken ?? null);
    this.user$.next(user);
    this.isAuthenticated$.next(true);

    this.persistSession(accessToken, refreshToken, user.username, nextExpiresAtMs);
    this.scheduleRefresh(nextExpiresAtMs);
  }

  private scheduleRefresh(expiresAtMs: number | null) {
    this.clearRefreshTimer();
    if (!expiresAtMs) return;

    const delay = Math.max(
      5_000,
      expiresAtMs - Date.now() - REFRESH_MARGIN_MS,
    );
    this.refreshTimeout = window.setTimeout(() => {
      void this.refreshTokens();
    }, delay);
  }

  private clearRefreshTimer() {
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout);
      this.refreshTimeout = null;
    }
  }

  private persistSession(
    accessToken: string,
    refreshToken: string | null,
    username: string,
    expiresAtMs: number,
  ) {
    localStorage.setItem(STORAGE_KEYS.accessToken, accessToken);
    if (refreshToken) {
      localStorage.setItem(STORAGE_KEYS.refreshToken, refreshToken);
    } else {
      localStorage.removeItem(STORAGE_KEYS.refreshToken);
    }
    localStorage.setItem(STORAGE_KEYS.user, username);
    localStorage.setItem(STORAGE_KEYS.expiresAt, String(expiresAtMs));
  }

  private async refreshTokens(): Promise<AuthTokens | null> {
    if (this.refreshPromise) return this.refreshPromise;

    const refreshToken =
      this.refreshToken$.getValue() ??
      localStorage.getItem(STORAGE_KEYS.refreshToken);
    const user = this.user$.getValue() ?? this.readStoredUser();

    if (!refreshToken || !user) return null;

    this.refreshPromise = (async () => {
      try {
        const data = await authService.refresh(refreshToken);
        this.applySession(
          data.accessToken,
          data.refreshToken,
          user,
          null,
          { expiresInSeconds: data.expiresIn, silentLoading: true },
        );
        return {
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
        };
      } catch (err) {
        this.error$.next(getErrorMessage(err, "Sessão expirada"));
        this.clearSession();
        return null;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }
}

export const authFacade = new AuthFacade();
