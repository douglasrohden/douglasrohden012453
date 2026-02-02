import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ArtistsFacade } from "../ArtistsFacade";
import { artistsService } from "../../services/artistsService";

vi.mock("../../services/artistsService", () => ({
  artistsService: {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  uploadArtistImages: vi.fn(),
}));

describe("ArtistsFacade", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("loads data when activated", async () => {
    const facade = new ArtistsFacade();
    const page = {
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

    const mockedGetAll = vi.mocked(artistsService.getAll);
    mockedGetAll.mockResolvedValue(page);

    facade.activate();
    await vi.runAllTimersAsync();
    await Promise.resolve();

    expect(artistsService.getAll).toHaveBeenCalled();
    expect(facade.data$.getValue().content[0].nome).toBe("Serj Tankian");

    facade.deactivate();
  });

  it("setQuery resets page and updates search", () => {
    const facade = new ArtistsFacade();
    facade.setPage(2);
    facade.setQuery("rock");

    const params = facade.params$.getValue();
    expect(params.page).toBe(0);
    expect(params.search).toBe("rock");
  });
});
