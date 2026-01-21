import { Navigate, Outlet } from "react-router-dom";
import { LoadingSpinner } from "./common/LoadingSpinner";
import { useAuthFacade } from "../hooks/useAuthFacade";

export function PublicRoute() {
  const { isAuthenticated, initializing } = useAuthFacade();

  if (initializing) {
    return <LoadingSpinner />;
  }

  if (isAuthenticated) {
    return <Navigate to="/artista" replace />;
  }

  return <Outlet />;
}
