import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import HomePage from "../HomePage";
import { ToastProvider } from "../../contexts/ToastContext";

vi.mock("../../hooks/useArtists", () => ({
  useArtists: () => ({
    artists: [
      { id: 1, nome: "Artista A", albumCount: 3, tipo: "CANTOR" },
      { id: 2, nome: "Artista B", albumCount: 1, tipo: "BANDA" },
    ],
    loading: false,
    error: null,
    page: 0,
    totalPages: 2,
    search: "",
    tipo: "TODOS",
    dir: "asc",
    setPage: vi.fn(),
    setSearch: vi.fn(),
    setTipo: vi.fn(),
    setDir: vi.fn(),
    refresh: vi.fn(),
  }),
}));

describe("HomePage", () => {
  it("deve renderizar lista de artistas com paginação", () => {
    render(
      <MemoryRouter>
        <ToastProvider>
          <HomePage />
        </ToastProvider>
      </MemoryRouter>,
    );

    expect(screen.getByText("Artistas")).toBeInTheDocument();
    expect(screen.getByText("Artista A")).toBeInTheDocument();
    expect(screen.getByText("Artista B")).toBeInTheDocument();
    expect(screen.getByText("Próxima")).toBeInTheDocument();
  });
});
