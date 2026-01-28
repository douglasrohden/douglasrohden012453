import { Navigate, Outlet } from "react-router-dom";
import { authFacade } from "../facades/AuthFacade";
import { useBehaviorSubjectValue } from "../hooks/useBehaviorSubjectValue";
import { LoadingSpinner } from "./common/LoadingSpinner";

export function ProtectedRoute() {
  const isAuthenticated = useBehaviorSubjectValue(authFacade.isAuthenticated$);
  const initialized = useBehaviorSubjectValue(authFacade.initialized$);
  const loading = useBehaviorSubjectValue(authFacade.loading$);

  if (!initialized || loading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center">
        <LoadingSpinner message="" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
