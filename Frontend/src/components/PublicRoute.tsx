import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export function PublicRoute() {
  const { isAuthenticated, initializing } = useAuth();

  if (initializing) return null;

  if (isAuthenticated) {
    return <Navigate to="/artista" replace />;
  }

  return <Outlet />;
}
