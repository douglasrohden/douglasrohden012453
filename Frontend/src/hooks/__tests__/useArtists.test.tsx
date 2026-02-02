import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BehaviorSubject } from "rxjs";
import type { Artista } from "../../services/artistsService";
import type { Page } from "../../types/Page";
import { useArtists } from "../useArtists";

const mockActivate = vi.fn();
const mockDeactivate = vi.fn();
const mockSetQuery = vi.fn();
const mockSetPage = vi.fn();
const mockSetTipo = vi.fn();
const mockSetSortDir = vi.fn();
const mockRefresh = vi.fn();

const page: Page<Artista> = {
  content: [
    {
      id: 1,
      nome: "Serj Tankian",
      albumCount: 3,
      tipo: "CANTOR",
      imageUrl: undefined,
    },
  ],
  totalPages: 1,
  totalElements: 1,
  last: true,
  size: 10,
  number: 0,
  sort: { empty: true, sorted: false, unsorted: true },
  numberOfElements: 1,
  first: true,
  empty: false,
};

const params = {
  page: 0,
  size: 10,
  search: "",
  sort: "nome" as const,
  dir: "asc" as const,
  tipo: "TODOS",
};

const data$ = new BehaviorSubject(page);
const params$ = new BehaviorSubject(params);
const loading$ = new BehaviorSubject(false);
const error$ = new BehaviorSubject<string | null>(null);

vi.mock("../../facades/ArtistsFacade", () => ({
  artistsFacade: {
    data$,
    params$,
    loading$,
    error$,
    activate: mockActivate,
    deactivate: mockDeactivate,
    setQuery: mockSetQuery,
    setPage: mockSetPage,
    setTipo: mockSetTipo,
    setSortDir: mockSetSortDir,
    refresh: mockRefresh,
  },
}));

function TestComponent() {
  const { artists, setSearch } = useArtists();
  return (
    <div>
      <span data-testid="artist-name">{artists[0]?.nome ?? ""}</span>
      <button type="button" onClick={() => setSearch("rock")}>Pesquisar</button>
    </div>
  );
}

describe("useArtists", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("exposes artists data and activates facade", () => {
    render(<TestComponent />);

    expect(screen.getByTestId("artist-name").textContent).toBe("Serj Tankian");
    expect(mockActivate).toHaveBeenCalledTimes(1);
  });

  it("calls facade setters", async () => {
    const user = userEvent.setup();
    render(<TestComponent />);

    await user.click(screen.getByRole("button", { name: "Pesquisar" }));
    expect(mockSetQuery).toHaveBeenCalledWith("rock");
  });
});
