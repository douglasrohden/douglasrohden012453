import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Suspense, lazy } from "react";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { PublicRoute } from "./components/PublicRoute";
import { ToastProvider } from "./contexts/ToastContext";
import { LoadingSpinner } from "./components/common/LoadingSpinner";
import { ApiGlobalToasts } from "./components/ApiGlobalToasts";

const LoginPage = lazy(() => import("./pages/LoginPage"));
const HomePage = lazy(() => import("./pages/HomePage"));
const AlbunsPage = lazy(() => import("./pages/AlbunsPage"));
const ArtistDetailPage = lazy(() => import("./pages/ArtistDetailPage"));

const ROUTES = {
  login: "/login",
  artists: "/artista",
  artistDetail: "/artista/:id",
  albuns: "/albuns",
} as const;

function FullScreenFallback() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center">
      <LoadingSpinner />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <ApiGlobalToasts />
        <Suspense fallback={<FullScreenFallback />}>
          <Routes>
            {/* rota raiz */}
            <Route
              path="/"
              element={<Navigate to={ROUTES.artists} replace />}
            />

            {/* rotas públicas */}
            <Route element={<PublicRoute />}>
              <Route path={ROUTES.login} element={<LoginPage />} />
            </Route>

            {/* rotas protegidas */}
            <Route element={<ProtectedRoute />}>
              <Route path={ROUTES.artists} element={<HomePage />} />
              <Route
                path={ROUTES.artistDetail}
                element={<ArtistDetailPage />}
              />
              <Route path={ROUTES.albuns} element={<AlbunsPage />} />
            </Route>

            {/* fallback */}
            <Route
              path="*"
              element={<Navigate to={ROUTES.artists} replace />}
            />
          </Routes>
        </Suspense>
      </ToastProvider>
    </BrowserRouter>
  );
}
