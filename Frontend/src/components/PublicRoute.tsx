import { Navigate, Outlet } from "react-router-dom";
import { authFacade } from "../facades/AuthFacade";
import { useBehaviorSubjectValue } from "../hooks/useBehaviorSubjectValue";

export function PublicRoute() {
  const isAuthenticated = useBehaviorSubjectValue(authFacade.isAuthenticated$);

  if (isAuthenticated) {
    return <Navigate to="/artista" replace />;
  }

  return <Outlet />;
}
