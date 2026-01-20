import { createContext, useContext, ReactNode } from "react";
import { useAuthFacade } from "../hooks/useAuthFacade";

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
    const auth = useAuthFacade();

    const login = (token: string, refreshToken: string, username: string) => {
        auth.updateTokens(token, refreshToken, username);
    };

    const logout = () => {
        auth.logout();
    };

    const value: AuthContextType = {
        isAuthenticated: auth.isAuthenticated,
        user: auth.user,
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
