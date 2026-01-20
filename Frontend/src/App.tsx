import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import AlbunsPage from "./pages/AlbunsPage";
import ArtistDetailPage from "./pages/ArtistDetailPage";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/artista" element={<HomePage />} />
            <Route path="/artista/:id" element={<ArtistDetailPage />} />
            <Route path="/albuns" element={<AlbunsPage />} />
          </Route>

          {/* Catch all redirect to home (which will redirect to login if not auth) */}
          <Route path="*" element={<Navigate to="/artista" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
