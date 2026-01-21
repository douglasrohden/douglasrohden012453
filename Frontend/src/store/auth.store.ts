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
    constructor() {
        super(initialState);
        this.loadStateFromLocalStorage();
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
    }

    /**
     * Remove a autenticação
     */
    clearAuthentication(): void {
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

