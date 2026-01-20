import { authFacade } from '../facades/auth.facade';
import { authStore, AuthState } from '../store/auth.store';
import { useObservable } from './useObservable';

const initialAuthState: AuthState = {
    isAuthenticated: false,
    user: null,
    accessToken: null,
    refreshToken: null,
};

/**
 * Hook customizado para usar o AuthFacade em componentes React
 * Fornece estado reativo e métodos de autenticação
 */
export function useAuthFacade() {
    // Subscreve ao estado reativo do store
    const authState = useObservable(authStore.state$, initialAuthState);

    return {
        // Estado reativo
        isAuthenticated: authState.isAuthenticated,
        user: authState.user,
        accessToken: authState.accessToken,
        refreshToken: authState.refreshToken,

        // Métodos do facade
        login: authFacade.login.bind(authFacade),
        logout: authFacade.logout.bind(authFacade),
        getAccessToken: authFacade.getAccessToken.bind(authFacade),
        getRefreshToken: authFacade.getRefreshToken.bind(authFacade),
        updateTokens: authFacade.updateTokens.bind(authFacade),
        hasValidTokens: authFacade.hasValidTokens.bind(authFacade),
    };
}
