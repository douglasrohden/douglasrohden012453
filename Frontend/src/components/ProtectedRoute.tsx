import { Navigate, Outlet } from "react-router-dom";
import { authFacade } from "../facades/AuthFacade";
import { useBehaviorSubjectValue } from "../hooks/useBehaviorSubjectValue";

export function ProtectedRoute() {
  const isAuthenticated = useBehaviorSubjectValue(authFacade.isAuthenticated$);

  // Note: If you had an 'initializing' state in Facade, you could check it here too.
  // For now assuming init happens fast or we can check user$ as well.
  // Ideally, AuthFacade should expose 'loading$' or 'initializing$' if async checks are needed on startup.
  // We'll rely on isAuthenticated default false -> redirects to login. 
  // If we need to wait for token check, we might need a loading state in AuthFacade.
  // The new AuthFacade runs init() in constructor synchronously reading localStorage, so it should be fine.

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
