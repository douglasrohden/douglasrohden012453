import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { PublicRoute } from "./components/PublicRoute";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import AlbunsPage from "./pages/AlbunsPage";
import ArtistDetailPage from "./pages/ArtistDetailPage";

export default function App() {
  return (
    <BrowserRouter>
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
    </BrowserRouter>
  );
}
