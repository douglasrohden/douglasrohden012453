import { Navigate, Outlet } from "react-router-dom";
import { Spinner } from "flowbite-react";
import { useAuthFacade } from "../hooks/useAuthFacade";

export function PublicRoute() {
  const { isAuthenticated, initializing } = useAuthFacade();

  if (initializing) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spinner size="xl" aria-label="Carregando..." />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/artista" replace />;
  }

  return <Outlet />;
}
