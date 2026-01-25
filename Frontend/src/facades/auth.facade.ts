import { BehaviorSubject, Observable } from "rxjs";
import { authStore, type AuthState } from "../store/auth.store";
import { authService, type LoginResponse } from "../services/authService";

/**
 * AuthFacade - Padrão Facade para operações de autenticação
 * Simplifica a interface entre componentes React e camadas de serviço/estado
 */
class AuthFacade {
  private readonly initializingSubject = new BehaviorSubject<boolean>(true);
  private initPromise: Promise<void> | null = null;
  private refreshPromise: Promise<boolean> | null = null;
  private refreshTimer: ReturnType<typeof setTimeout> | null = null;
  private scheduledExpMs: number | null = null;

  // refresh a bit before token expires to avoid 401 bursts
  private static readonly REFRESH_SKEW_MS = 15_000;
  private static readonly MIN_REFRESH_DELAY_MS = 1_000;

  constructor() {
    // Keep token renewal running while the app is open.
    authStore.state$.subscribe((state) => {
      this.onAuthStateChange(state);
    });

    // Ensure we schedule based on the initial loaded state as well.
    this.onAuthStateChange(authStore.currentState);
  }

  private clearRefreshTimer(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
    this.scheduledExpMs = null;
  }

  private decodeJwtExpMs(token: string): number | null {
    try {
      const parts = token.split(".");
      if (parts.length < 2) return null;

      const base64Url = parts[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const padded = base64.padEnd(
        base64.length + ((4 - (base64.length % 4)) % 4),
        "=",
      );

      if (typeof window === "undefined" || typeof window.atob !== "function") {
        return null;
      }

      const json = window.atob(padded);
      const payload = JSON.parse(json) as { exp?: number };
      const exp = payload?.exp;
      if (typeof exp !== "number") return null;

      // exp is typically in seconds. Accept ms too.
      return exp > 1_000_000_000_000 ? exp : exp * 1000;
    } catch {
      return null;
    }
  }

  private onAuthStateChange(state: AuthState): void {
    const { accessToken, refreshToken, user, isAuthenticated } = state;

    // If we can't refresh, or user is not authenticated, don't keep a timer.
    if (!isAuthenticated || !accessToken || !refreshToken || !user) {
      this.clearRefreshTimer();
      return;
    }

    const expMs = this.decodeJwtExpMs(accessToken);
    if (!expMs) {
      // If we can't read exp, rely on 401-based refresh in the API client.
      this.clearRefreshTimer();
      return;
    }

    if (this.scheduledExpMs === expMs) {
      return;
    }

    this.clearRefreshTimer();
    this.scheduledExpMs = expMs;

    const delayMs = Math.max(
      AuthFacade.MIN_REFRESH_DELAY_MS,
      expMs - Date.now() - AuthFacade.REFRESH_SKEW_MS,
    );

    this.refreshTimer = setTimeout(() => {
      // Fire-and-forget: tryRefresh is single-flight and cleans auth on failure.
      void this.tryRefresh();
    }, delayMs);
  }

  /**
   * Observable do estado de autenticação
   */
  get authState$(): Observable<AuthState> {
    return authStore.state$;
  }

  /**
   * Observable de inicialização (refresh on load)
   */
  get initializing$(): Observable<boolean> {
    return this.initializingSubject.asObservable();
  }

  get isInitializing(): boolean {
    return this.initializingSubject.getValue();
  }

  /**
   * Obtém o estado atual de autenticação (snapshot)
   */
  get currentAuthState(): AuthState {
    return authStore.currentState;
  }

  /**
   * Verifica se o usuário está autenticado
   */
  get isAuthenticated(): boolean {
    return authStore.currentState.isAuthenticated;
  }

  /**
   * Obtém o usuário atual
   */
  get currentUser(): string | null {
    return authStore.currentState.user;
  }

  /**
   * Realiza login do usuário
   * @param username - Nome de usuário
   * @param password - Senha do usuário
   * @returns Promise com resposta de login
   */
  async login(username: string, password: string): Promise<LoginResponse> {
    try {
      const response = await authService.login(username, password);

      // Atualiza o store com os dados de autenticação
      authStore.setAuthenticated(
        response.accessToken,
        response.refreshToken,
        username,
      );

      return response;
    } catch (error) {
      // Em caso de erro, garante que o estado está limpo
      authStore.clearAuthentication();
      throw error;
    }
  }

  /**
   * Logout apenas limpa estado. Navegação fica a cargo do AuthProvider.
   */
  logout(): void {
    authStore.clearAuthentication();
  }

  /**
   * Tenta renovar tokens usando refresh token (single-flight).
   * Retorna true se conseguiu renovar.
   */
  async tryRefresh(): Promise<boolean> {
    if (this.refreshPromise) return this.refreshPromise;

    this.refreshPromise = (async () => {
      const { refreshToken, user } = authStore.currentState;
      if (!refreshToken || !user) return false;

      try {
        const res = await authService.refresh(refreshToken);
        authStore.setAuthenticated(res.accessToken, res.refreshToken, user);
        return true;
      } catch {
        authStore.clearAuthentication();
        return false;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  /**
   * Boot: se já está autenticado, ok.
   * Se há refreshToken e não está autenticado, tenta uma renovação.
   */
  initialize(): Promise<void> {
    if (this.initPromise) return this.initPromise;

    this.initializingSubject.next(true);
    this.initPromise = (async () => {
      const { isAuthenticated, refreshToken } = authStore.currentState;
      if (isAuthenticated) return;

      if (refreshToken) {
        await this.tryRefresh();
      } else {
        authStore.clearAuthentication();
      }
    })().finally(() => {
      this.initializingSubject.next(false);
    });

    return this.initPromise;
  }

  /**
   * Obtém o token de acesso atual
   */
  getAccessToken(): string | null {
    return authStore.currentState.accessToken;
  }

  /**
   * Obtém o token de refresh atual
   */
  getRefreshToken(): string | null {
    return authStore.currentState.refreshToken;
  }

  /**
   * Atualiza os tokens de autenticação
   * @param accessToken - Novo token de acesso
   * @param refreshToken - Novo token de refresh
   * @param username - Nome de usuário (opcional, usa o atual se não fornecido)
   */
  updateTokens(
    accessToken: string,
    refreshToken: string,
    username?: string,
  ): void {
    const user = username || authStore.currentState.user;
    if (user) {
      authStore.setAuthenticated(accessToken, refreshToken, user);
    }
  }

  /**
   * Verifica se os tokens estão válidos (método auxiliar)
   */
  hasValidTokens(): boolean {
    const { accessToken, refreshToken } = authStore.currentState;
    return !!(accessToken && refreshToken);
  }
}

// Singleton instance
export const authFacade = new AuthFacade();
