import {
  BehaviorSubject,
  combineLatest,
  debounceTime,
  from,
  switchMap,
} from "rxjs";
import { getErrorMessage, getHttpStatus } from "../lib/http";
import {
  artistsService,
  type Artista,
  type Album,
} from "../services/artistsService";
import { uploadAlbumImages } from "../services/albunsService";

type ArtistDetailParams = {
  artistId: number | null;
  search: string;
  sortField: "titulo" | "ano";
  sortDir: "asc" | "desc";
};

type ArtistDetailData = {
  artist: (Artista & { albuns?: Album[] }) | null;
  albums: Album[];
  visibleAlbums: Album[];
};

const EMPTY_DATA: ArtistDetailData = {
  artist: null,
  albums: [],
  visibleAlbums: [],
};

const INITIAL_PARAMS: ArtistDetailParams = {
  artistId: null,
  search: "",
  sortField: "titulo",
  sortDir: "asc",
};

function sortAlbums(albums: Album[], params: ArtistDetailParams): Album[] {
  const filtered = params.search.trim()
    ? albums.filter((album) =>
        (album?.titulo ?? "")
          .toLowerCase()
          .includes(params.search.trim().toLowerCase()),
      )
    : albums;

  const sorted = [...filtered].sort((a, b) => {
    const aVal = a?.[params.sortField];
    const bVal = b?.[params.sortField];

    if (aVal == null && bVal == null) return 0;
    if (aVal == null) return 1;
    if (bVal == null) return -1;

    if (typeof aVal === "number" && typeof bVal === "number") {
      return aVal - bVal;
    }

    return String(aVal).localeCompare(String(bVal), "pt-BR", {
      sensitivity: "base",
    });
  });

  return params.sortDir === "asc" ? sorted : sorted.reverse();
}

export class ArtistDetailFacade {
  readonly data$ = new BehaviorSubject<ArtistDetailData>(EMPTY_DATA);
  readonly loading$ = new BehaviorSubject<boolean>(false);
  readonly error$ = new BehaviorSubject<string | null>(null);
  readonly params$ = new BehaviorSubject<ArtistDetailParams>(INITIAL_PARAMS);
  readonly status$ = new BehaviorSubject<number | null>(null);

  private readonly refresh$ = new BehaviorSubject<number>(0);

  constructor() {
    combineLatest([this.params$, this.refresh$])
      .pipe(
        debounceTime(200),
        switchMap(([params]) => from(this.load(params))),
      )
      .subscribe((result) => {
        this.loading$.next(false);
        if (result.ok) {
          this.status$.next(null);
          return;
        }

        const status = getHttpStatus(result.error);
        this.status$.next(status ?? null);
        if (status !== 429) {
          this.error$.next(
            getErrorMessage(result.error, "Erro ao carregar artista"),
          );
        }
      });
  }

  get snapshot() {
    return {
      data: this.data$.getValue(),
      params: this.params$.getValue(),
      loading: this.loading$.getValue(),
      error: this.error$.getValue(),
    };
  }

  setArtistId(artistId: number | null) {
    this.params$.next({ ...this.params$.getValue(), artistId });
  }

  setSearch(search: string) {
    const trimmed = search.trim();
    this.params$.next({ ...this.params$.getValue(), search: trimmed });
    this.recomputeVisibleAlbums();
  }

  setSortField(sortField: ArtistDetailParams["sortField"]) {
    this.params$.next({ ...this.params$.getValue(), sortField });
    this.recomputeVisibleAlbums();
  }

  setSortDir(sortDir: ArtistDetailParams["sortDir"]) {
    this.params$.next({ ...this.params$.getValue(), sortDir });
    this.recomputeVisibleAlbums();
  }

  refresh() {
    this.refresh$.next(this.refresh$.getValue() + 1);
  }

  async addAlbumToArtist(
    payload: { titulo: string; ano?: number },
    files?: File[],
  ): Promise<Album | null> {
    const artistId = this.params$.getValue().artistId;
    if (!artistId) return null;

    this.loading$.next(true);
    this.error$.next(null);
    try {
      const artist = await artistsService.addAlbum(artistId, payload);
      const created = artist.albuns?.[artist.albuns.length - 1];
      if (created?.id && files?.length) {
        await uploadAlbumImages(created.id, files);
      }
      this.data$.next({
        artist,
        albums: artist.albuns ?? [],
        visibleAlbums: sortAlbums(artist.albuns ?? [], this.params$.getValue()),
      });
      return created ?? null;
    } catch (err) {
      this.error$.next(getErrorMessage(err, "Erro ao adicionar álbum"));
      throw err;
    } finally {
      this.loading$.next(false);
    }
  }

  patchAlbum(updated: Album) {
    const current = this.data$.getValue();
    if (!current.artist) return;

    const albums = (current.albums ?? []).map((album) =>
      album.id === updated.id ? { ...album, ...updated } : album,
    );

    this.data$.next({
      artist: current.artist,
      albums,
      visibleAlbums: sortAlbums(albums, this.params$.getValue()),
    });
  }

  patchArtist(updated: Partial<Artista>) {
    const current = this.data$.getValue();
    if (!current.artist) return;
    const artist = { ...current.artist, ...updated };
    this.data$.next({
      artist,
      albums: current.albums,
      visibleAlbums: current.visibleAlbums,
    });
  }

  private recomputeVisibleAlbums() {
    const { albums } = this.data$.getValue();
    this.data$.next({
      ...this.data$.getValue(),
      visibleAlbums: sortAlbums(albums, this.params$.getValue()),
    });
  }

  private async load(params: ArtistDetailParams) {
    if (!params.artistId) {
      this.data$.next(EMPTY_DATA);
      return { ok: true } as const;
    }

    this.loading$.next(true);
    this.error$.next(null);

    try {
      const artist = await artistsService.getById(params.artistId);
      const albums = artist.albuns ?? [];
      this.data$.next({
        artist,
        albums,
        visibleAlbums: sortAlbums(albums, params),
      });
      return { ok: true } as const;
    } catch (error) {
      return { ok: false, error } as const;
    }
  }
}

export const artistDetailFacade = new ArtistDetailFacade();
