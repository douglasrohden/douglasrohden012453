import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { authStore } from "../store/auth.store";
import { auth } from "../auth/auth.singleton";

/**
 * AuthContext - Mantido para compatibilidade com código existente
 * Agora utiliza AuthFacade e BehaviorSubject internamente
 */
interface AuthContextType {
    isAuthenticated: boolean;
    refreshAuthState: () => void;
    logout: (redirectTo?: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isAuthenticated, setIsAuthenticated] = useState(() => authStore.currentState.isAuthenticated);

    useEffect(() => {
        const sub = authStore.state$.subscribe((state) => {
            setIsAuthenticated(state.isAuthenticated);
        });
        return () => sub.unsubscribe();
    }, []);

    const refreshAuthState = useCallback(() => {
        setIsAuthenticated(authStore.currentState.isAuthenticated);
    }, []);

    const logout = useCallback(
        (redirectTo = "/login") => {
            authStore.clearAuthentication();
            setIsAuthenticated(false);

            if (location.pathname !== redirectTo) {
                navigate(redirectTo, { replace: true });
            }
        },
        [navigate, location.pathname]
    );

    useEffect(() => {
        auth.bindLogout(logout);
    }, [logout]);

    const value = useMemo(() => ({ isAuthenticated, refreshAuthState, logout }), [isAuthenticated, refreshAuthState, logout]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Hook para usar o AuthContext
 * Hook para usar o AuthContext
 */
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
