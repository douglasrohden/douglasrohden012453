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
  user: "user",
} as const;

const REFRESH_MARGIN_MS = 60_000; // refresh 1 min before expiry
const DEFAULT_EXPIRES_SECONDS = 5 * 60;

class AuthFacade {
  readonly accessToken$ = new BehaviorSubject<string | null>(null);
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
      getRefreshToken: () => null,
      refreshTokens: () => this.refreshTokens(),
      onAuthFailure: () => this.logout(),
    });
  }

  async init(): Promise<void> {
    if (this.initialized$.getValue()) return;
    this.loading$.next(true);
    this.error$.next(null);

    const storedUser = this.readStoredUser();
    if (storedUser) {
      this.user$.next(storedUser);
    }

    // Attempt refresh using httpOnly cookie (if present)
    await this.refreshTokens(true);

    this.loading$.next(false);
    this.initialized$.next(true);
  }

  async login(username: string, password: string): Promise<boolean> {
    this.loading$.next(true);
    this.error$.next(null);

    try {
      const data: LoginResponse = await authService.login(username, password);
      this.applySession(data.accessToken, { username }, null, {
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
    this.user$.next(null);
    this.isAuthenticated$.next(false);
    this.error$.next(null);

    localStorage.removeItem(STORAGE_KEYS.user);
  }

  private readStoredUser(): AuthUser | null {
    const user = localStorage.getItem(STORAGE_KEYS.user);
    if (!user) return null;
    return { username: user };
  }

  private applySession(
    accessToken: string,
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
    this.user$.next(user);
    this.isAuthenticated$.next(true);

    this.persistSession(user.username);
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

  private persistSession(username: string) {
    localStorage.setItem(STORAGE_KEYS.user, username);
  }

  private async refreshTokens(silent = false): Promise<AuthTokens | null> {
    if (this.refreshPromise) return this.refreshPromise;

    this.refreshPromise = (async () => {
      try {
        const data = await authService.refresh();
        const user =
          this.user$.getValue() ??
          this.readStoredUser() ??
          this.decodeUserFromToken(data.accessToken);

        if (!user) {
          this.clearSession();
          return null;
        }

        this.applySession(
          data.accessToken,
          user,
          null,
          { expiresInSeconds: data.expiresIn, silentLoading: true },
        );
        return {
          accessToken: data.accessToken,
        };
      } catch (err) {
        if (!silent) {
          this.error$.next(getErrorMessage(err, "Sessão expirada"));
        }
        this.clearSession();
        return null;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  private decodeUserFromToken(accessToken: string): AuthUser | null {
    try {
      const [, payload] = accessToken.split(".");
      if (!payload) return null;
      const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
      const json = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => `%${c.charCodeAt(0).toString(16).padStart(2, "0")}`)
          .join(""),
      );
      const data = JSON.parse(json) as { sub?: string };
      if (data?.sub) return { username: data.sub };
      return null;
    } catch {
      return null;
    }
  }
}

export const authFacade = new AuthFacade();
