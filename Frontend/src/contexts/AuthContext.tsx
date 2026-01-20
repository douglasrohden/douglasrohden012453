import { createContext, useContext, ReactNode } from "react";
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const authState = useObservable(authStore.state$, {
        isAuthenticated: false,
        user: null,
        accessToken: null,
        refreshToken: null,
    });

    const login = (token: string, refreshToken: string, username: string) => {
        authStore.setAuthenticated(token, refreshToken, username);
    };

    const logout = () => {
        authStore.clearAuthentication();
    };

    const value: AuthContextType = {
        isAuthenticated: authState.isAuthenticated,
        user: authState.user,
        login,
        logout,
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
