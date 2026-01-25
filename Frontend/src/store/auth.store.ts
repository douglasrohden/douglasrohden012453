import { BaseStore } from "./base.store";

export interface AuthState {
  isAuthenticated: boolean;
  user: string | null;
  accessToken: string | null;
  refreshToken: string | null;
}

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  accessToken: null,
  refreshToken: null,
};

/**
 * AuthStore - Gerenciador de estado de autenticação usando BehaviorSubject
 * Implementa o padrão Observable para gestão reativa de estado
 */
class AuthStore extends BaseStore<AuthState> {
  constructor() {
    super(initialState);
    this.loadStateFromLocalStorage();
  }

  private decodeJwtPayload(token: string): { exp?: number } | null {
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
      return JSON.parse(json) as { exp?: number };
    } catch {
      return null;
    }
  }

  /**
   * Define o usuário autenticado
   */
  setAuthenticated(
    accessToken: string,
    refreshToken: string,
    username: string,
  ): void {
    this.setState({
      isAuthenticated: true,
      user: username,
      accessToken,
      refreshToken,
    });
    this.saveStateToLocalStorage(this.currentState);
  }

  /**
   * Remove a autenticação
   */
  clearAuthentication(): void {
    this.setState(initialState);
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
  }

  /**
   * Reseta o estado para o inicial
   */
  reset(): void {
    this.clearAuthentication();
  }

  /**
   * Carrega estado do localStorage
   */
  private loadStateFromLocalStorage(): void {
    const accessToken = localStorage.getItem("accessToken");
    const refreshToken = localStorage.getItem("refreshToken");
    const user = localStorage.getItem("user");

    // Se houver refreshToken+user, preserva isso para permitir renovação.
    // O refresh real é disparado pela AuthFacade no boot, ou pelo interceptor (401).
    if (user && refreshToken && !accessToken) {
      this._state$.next({
        isAuthenticated: false,
        user,
        accessToken: null,
        refreshToken,
      });
      return;
    }

    if (accessToken && user) {
      // Se o access token já expirou, NÃO apagamos o refreshToken automaticamente;
      // mantemos user+refreshToken para tentar renovar no boot.
      const payload = this.decodeJwtPayload(accessToken);
      const expSeconds = payload?.exp;
      if (expSeconds && typeof expSeconds === "number") {
        const expMs =
          expSeconds > 1_000_000_000_000 ? expSeconds : expSeconds * 1000;
        if (expMs <= Date.now()) {
          localStorage.removeItem("accessToken");
          this._state$.next({
            isAuthenticated: false,
            user,
            accessToken: null,
            refreshToken,
          });
          return;
        }
      }

      this._state$.next({
        isAuthenticated: true,
        user,
        accessToken,
        refreshToken,
      });
    }
  }

  /**
   * Salva estado no localStorage
   */
  private saveStateToLocalStorage(state: AuthState): void {
    if (state.accessToken)
      localStorage.setItem("accessToken", state.accessToken);
    else localStorage.removeItem("accessToken");

    if (state.refreshToken)
      localStorage.setItem("refreshToken", state.refreshToken);
    else localStorage.removeItem("refreshToken");

    if (state.user) localStorage.setItem("user", state.user);
    else localStorage.removeItem("user");
  }
}

// Singleton instance
export const authStore = new AuthStore();
