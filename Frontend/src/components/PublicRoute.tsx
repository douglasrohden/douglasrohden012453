import { Navigate, Outlet } from "react-router-dom";
import { useAuthFacade } from "../hooks/useAuthFacade";

export function PublicRoute() {
  const { isAuthenticated, initializing } = useAuthFacade();

  if (initializing) {
    return <div>Carregando...</div>;
  }

  if (isAuthenticated) {
    return <Navigate to="/artista" replace />;
  }

  return <Outlet />;
}
