import { createContext, useCallback, useContext, ReactNode, useEffect, useMemo, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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
    logout: (redirectTo?: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const authState = useObservable(authStore.state$, {
        isAuthenticated: false,
        user: null,
        accessToken: null,
        refreshToken: null,
    });

    const login = (token: string, refreshToken: string, username: string) => {
        authStore.setAuthenticated(token, refreshToken, username);
    };

    const logout = useCallback((redirectTo = "/login") => {
        authStore.clearAuthentication();
        if (location.pathname !== redirectTo) {
            navigate(redirectTo, { replace: true });
        }
    }, [navigate, location.pathname]);

    // Se algo externo limpar a autenticação (ex.: interceptor 401 ou timer),
    // garante que o usuário seja levado ao login sem recarregar a SPA.
    const prevAuthRef = useRef<boolean>(authState.isAuthenticated);
    useEffect(() => {
        const prev = prevAuthRef.current;
        const now = authState.isAuthenticated;
        prevAuthRef.current = now;

        if (prev && !now && location.pathname !== "/login") {
            navigate("/login", { replace: true });
        }
    }, [authState.isAuthenticated, navigate, location.pathname]);

    const value: AuthContextType = useMemo(() => ({
        isAuthenticated: authState.isAuthenticated,
        user: authState.user,
        login,
        logout,
    }), [authState.isAuthenticated, authState.user, logout]);

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
