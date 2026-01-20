import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { authService } from "../services/authService";

interface AuthContextType {
    isAuthenticated: boolean;
    user: string | null;
    login: (token: string, refreshToken: string, username: string) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [user, setUser] = useState<string | null>(null);

    useEffect(() => {
        const checkAuth = () => {
            const isAuth = authService.isAuthenticated();
            const currentUser = authService.getCurrentUser();

            setIsAuthenticated(isAuth);
            setUser(currentUser);
        };

        checkAuth();

        // Listen for storage changes (e.g. from axios interceptor logout)
        window.addEventListener("storage", checkAuth);
        return () => window.removeEventListener("storage", checkAuth);
    }, []);

    const login = (token: string, refreshToken: string, username: string) => {
        localStorage.setItem("accessToken", token);
        localStorage.setItem("refreshToken", refreshToken);
        localStorage.setItem("user", username);
        setIsAuthenticated(true);
        setUser(username);
    };

    const logout = () => {
        authService.logout();
        setIsAuthenticated(false);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
