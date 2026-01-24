import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { auth } from "../auth/auth.singleton";
import { authFacade } from "../facades/auth.facade";
import type { AuthState } from "../store/auth.store";

/**
 * AuthContext - Mantido para compatibilidade com código existente
 * Agora utiliza AuthFacade e BehaviorSubject internamente
 */
interface AuthContextType {
    isAuthenticated: boolean;
    initializing: boolean;
    user: string | null;
    logout: (redirectTo?: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [authState, setAuthState] = useState<AuthState>(() => authFacade.currentAuthState);
    const [initializing, setInitializing] = useState<boolean>(() => authFacade.isInitializing);

    useEffect(() => {
        const authSub = authFacade.authState$.subscribe(setAuthState);
        const initSub = authFacade.initializing$.subscribe(setInitializing);

        void authFacade.initialize();

        return () => {
            authSub.unsubscribe();
            initSub.unsubscribe();
        };
    }, []);

    const logout = useCallback(
        (redirectTo = "/login") => {
            authFacade.logout();

            if (location.pathname !== redirectTo) {
                navigate(redirectTo, { replace: true });
            }
        },
        [navigate, location.pathname]
    );

    useEffect(() => {
        auth.bindLogout(logout);
    }, [logout]);

    const value = useMemo(
        () => ({
            isAuthenticated: authState.isAuthenticated,
            initializing,
            user: authState.user,
            logout,
        }),
        [authState.isAuthenticated, authState.user, initializing, logout]
    );

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
