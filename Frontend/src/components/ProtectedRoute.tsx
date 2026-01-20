import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export const ProtectedRoute = () => {
    const { isAuthenticated, initializing } = useAuth();

    // While we are determining auth state (refresh in progress), render nothing / loading
    if (initializing) {
        return <div>Carregando...</div>;
    }

    // If not authenticated, redirect to login page
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // If authenticated, render child routes
    return <Outlet />;
};
