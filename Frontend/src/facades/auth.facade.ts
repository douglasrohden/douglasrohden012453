import { Observable } from 'rxjs';
import { authStore, AuthState } from '../store/auth.store';
import { authService, LoginResponse } from '../services/authService';

/**
 * AuthFacade - Padrão Facade para operações de autenticação
 * Simplifica a interface entre componentes React e camadas de serviço/estado
 */
class AuthFacade {
    /**
     * Observable do estado de autenticação
     */
    get authState$(): Observable<AuthState> {
        return authStore.state$;
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
                username
            );

            return response;
        } catch (error) {
            // Em caso de erro, garante que o estado está limpo
            authStore.clearAuthentication();
            throw error;
        }
    }

    /**
     * Realiza logout do usuário
     */
    logout(): void {
        authStore.clearAuthentication();
        window.location.href = '/login';
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
    updateTokens(accessToken: string, refreshToken: string, username?: string): void {
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
