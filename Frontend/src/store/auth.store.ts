import { BaseStore } from './base.store';

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
    private logoutTimerId: number | null = null;

    constructor() {
        super(initialState);
        this.loadStateFromLocalStorage();
    }

    private clearLogoutTimer(): void {
        if (this.logoutTimerId !== null) {
            window.clearTimeout(this.logoutTimerId);
            this.logoutTimerId = null;
        }
    }

    private decodeJwtPayload(token: string): { exp?: number } | null {
        try {
            const parts = token.split('.');
            if (parts.length < 2) return null;

            const base64Url = parts[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');

            if (typeof window === 'undefined' || typeof window.atob !== 'function') {
                return null;
            }

            const json = window.atob(padded);
            return JSON.parse(json) as { exp?: number };
        } catch {
            return null;
        }
    }

    private scheduleLogoutForToken(accessToken: string): void {
        this.clearLogoutTimer();

        const payload = this.decodeJwtPayload(accessToken);
        const expSeconds = payload?.exp;

        if (!expSeconds || typeof expSeconds !== 'number') {
            // If token has no exp, we can't auto-expire; rely on 401 handling.
            return;
        }

        // JWT spec uses NumericDate in seconds, but some implementations may emit ms.
        // Make this robust: if it's already in ms (13 digits), don't multiply again.
        const expiresAtMs = expSeconds > 1_000_000_000_000 ? expSeconds : expSeconds * 1000;
        const msUntilExpiry = expiresAtMs - Date.now();

        // Expire slightly early to avoid edge timing issues.
        const logoutInMs = msUntilExpiry - 1000;

        if (logoutInMs <= 0) {
            this.expireNowAndRedirect();
            return;
        }

        this.logoutTimerId = window.setTimeout(() => {
            this.expireNowAndRedirect();
        }, logoutInMs);
    }

    private expireNowAndRedirect(): void {
        this.clearAuthentication();
    }

    /**
     * Define o usuário autenticado
     */
    setAuthenticated(accessToken: string, refreshToken: string, username: string): void {
        this.setState({
            isAuthenticated: true,
            user: username,
            accessToken,
            refreshToken,
        });
        this.saveStateToLocalStorage(this.currentState);

        // Requisito: não renovar automaticamente; apenas expirar e forçar novo login.
        this.scheduleLogoutForToken(accessToken);
    }

    /**
     * Remove a autenticação
     */
    clearAuthentication(): void {
        this.clearLogoutTimer();
        this.setState(initialState);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
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
        const accessToken = localStorage.getItem('accessToken');
        const refreshToken = localStorage.getItem('refreshToken');
        const user = localStorage.getItem('user');

        if (accessToken && user) {
            // If token is already expired, clear everything and force login.
            const payload = this.decodeJwtPayload(accessToken);
            const expSeconds = payload?.exp;
            if (expSeconds && typeof expSeconds === 'number') {
                const expMs = expSeconds > 1_000_000_000_000 ? expSeconds : expSeconds * 1000;
                if (expMs <= Date.now()) {
                    this.clearAuthentication();
                    return;
                }
            }

            this._state$.next({
                isAuthenticated: true,
                user,
                accessToken,
                refreshToken,
            });

            this.scheduleLogoutForToken(accessToken);
        }
    }

    /**
     * Salva estado no localStorage
     */
    private saveStateToLocalStorage(state: AuthState): void {
        if (state.accessToken) {
            localStorage.setItem('accessToken', state.accessToken);
        }
        if (state.refreshToken) {
            localStorage.setItem('refreshToken', state.refreshToken);
        }
        if (state.user) {
            localStorage.setItem('user', state.user);
        }
    }
}

// Singleton instance
export const authStore = new AuthStore();

