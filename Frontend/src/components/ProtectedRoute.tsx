import { Navigate, Outlet } from "react-router-dom";
import { LoadingSpinner } from "./common/LoadingSpinner";
import { useAuthFacade } from "../hooks/useAuthFacade";

export function ProtectedRoute() {
    const { isAuthenticated, initializing } = useAuthFacade();

    // While we are determining auth state (refresh in progress), render nothing / loading
    if (initializing) {
        return <LoadingSpinner />;
    }

    // If not authenticated, redirect to login page
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // If authenticated, render child routes
    return <Outlet />;
}

