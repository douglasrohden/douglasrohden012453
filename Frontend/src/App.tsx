import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Suspense, lazy } from "react";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { PublicRoute } from "./components/PublicRoute";
import { ToastProvider } from "./contexts/ToastContext";
import { LoadingSpinner } from "./components/common/LoadingSpinner";

const LoginPage = lazy(() => import("./pages/LoginPage"));
const HomePage = lazy(() => import("./pages/HomePage"));
const AlbunsPage = lazy(() => import("./pages/AlbunsPage"));
const ArtistDetailPage = lazy(() => import("./pages/ArtistDetailPage"));

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <Suspense fallback={<div className="h-screen w-full flex items-center justify-center"><LoadingSpinner /></div>}>
          <Routes>
            <Route element={<PublicRoute />}>
              <Route path="/login" element={<LoginPage />} />
            </Route>

            <Route element={<ProtectedRoute />}>
              <Route path="/artista" element={<HomePage />} />
              <Route path="/artista/:id" element={<ArtistDetailPage />} />
              <Route path="/albuns" element={<AlbunsPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/artista" replace />} />
          </Routes>
        </Suspense>
      </ToastProvider>
    </BrowserRouter>
  );
}
