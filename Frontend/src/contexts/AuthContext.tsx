import { createContext, useContext, ReactNode, useEffect, useState } from "react";
import { useObservable } from "../hooks/useObservable";
import { authStore } from "../store/auth.store";

/**
 * AuthContext - Mantido para compatibilidade com código existente
 * Agora utiliza AuthFacade e BehaviorSubject internamente
 */
interface AuthContextType {
    isAuthenticated: boolean;
    user: string | null;
    login: (token: string, refreshToken: string, username: string) => void;
    logout: () => void;
    initializing: boolean; // true while trying to refresh on load
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const authState = useObservable(authStore.state$, {
        isAuthenticated: false,
        user: null,
        accessToken: null,
        refreshToken: null,
    });

    const [initializing, setInitializing] = useState(true);

    const login = (token: string, refreshToken: string, username: string) => {
        authStore.setAuthenticated(token, refreshToken, username);
    };

    const logout = () => {
        authStore.clearAuthentication();
    };

    // Attempt automatic refresh on app load if we have a refresh token but no access token
    // This prevents immediate redirect to /login on page reload when tokens are expired
    useEffect(() => {
        let mounted = true;
        const tryRefreshOnLoad = async () => {
            const refreshToken = localStorage.getItem("refreshToken");
            const user = localStorage.getItem("user");

            if (authState.isAuthenticated) {
                // Already authenticated from local storage
                if (mounted) setInitializing(false);
                return;
            }

            if (refreshToken && user && mounted) {
                try {
                    // dynamic import to avoid circular dependencies at module load time
                    const { authService } = await import("../services/authService");
                    const data = await authService.refresh(refreshToken);
                    if (data.accessToken && mounted) {
                        authStore.setAuthenticated(data.accessToken, data.refreshToken ?? refreshToken, user);
                    }
                } catch (e) {
                    // If refresh fails, clear authentication
                    authStore.clearAuthentication();
                }
            }

            if (mounted) setInitializing(false);
        };
        tryRefreshOnLoad();
        return () => { mounted = false; };
    }, [authState.isAuthenticated]);

    const value: AuthContextType = {
        isAuthenticated: authState.isAuthenticated,
        user: authState.user,
        login,
        logout,
        initializing,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Hook para usar o AuthContext
 * @deprecated Prefira usar useAuthFacade() diretamente
 */
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
