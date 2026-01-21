import { Navigate, Outlet } from "react-router-dom";
import { useAuthFacade } from "../hooks/useAuthFacade";

export const ProtectedRoute = () => {
    const { isAuthenticated, initializing } = useAuthFacade();

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

