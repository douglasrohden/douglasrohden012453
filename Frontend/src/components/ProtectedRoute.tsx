import { Navigate, Outlet } from "react-router-dom";
import { useAuthFacade } from "../hooks/useAuthFacade";

export function ProtectedRoute() {
    const { isAuthenticated } = useAuthFacade();

    // If not authenticated, redirect to login page
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // If authenticated, render child routes
    return <Outlet />;
}

