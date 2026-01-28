import {
  BehaviorSubject,
  Subject,
  Subscription,
  merge,
  debounceTime,
  distinctUntilChanged,
  from,
  switchMap,
  map,
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

  private readonly refresh$ = new Subject<void>();
  private sub: Subscription | null = null;
  private lastLoadKey: string | null = null;
  private lastLoadAtMs = 0;
  private activeCount = 0;
  private inFlightKey: string | null = null;
  private pendingKey: string | null = null;

  activate(): void {
    if (this.activeCount > 0) return; // idempotente
    this.activeCount = 1;
    if (this.sub) return; // seguranca extra

    const paramsChanged$ = this.params$.pipe(
      distinctUntilChanged((a, b) => a.artistId === b.artistId),
      map(() => undefined),
    );

    this.sub = merge(paramsChanged$, this.refresh$)
      .pipe(
        debounceTime(200),
        switchMap(() => from(this.loadRequest(this.params$.getValue()))),
      )
      .subscribe((result) => {
        if ("skipped" in result) return;
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

    // 1 load inicial
    this.loadData(true);
  }

  deactivate(): void {
    if (this.activeCount === 0) return;
    this.activeCount = 0;
    this.sub?.unsubscribe();
    this.sub = null;
    this.pendingKey = null;
  }

  get snapshot() {
    return {
      data: this.data$.getValue(),
      params: this.params$.getValue(),
      loading: this.loading$.getValue(),
      error: this.error$.getValue(),
      status: this.status$.getValue(),
    };
  }

  setArtistId(artistId: number | null) {
    const current = this.params$.getValue();
    if (current.artistId === artistId) return;
    this.params$.next({ ...current, artistId });
    // Mudanca de artista deve limpar dados/status imediatamente (evita flash).
    this.data$.next(EMPTY_DATA);
    this.error$.next(null);
    this.status$.next(null);
  }

  setSearch(search: string) {
    // Busca/ordenacao sao locais e nao disparam carga remota.
    const trimmed = search.trim();
    this.params$.next({ ...this.params$.getValue(), search: trimmed });
    this.recomputeVisibleAlbums();
  }

  setSortField(sortField: ArtistDetailParams["sortField"]) {
    // Busca/ordenacao sao locais e nao disparam carga remota.
    this.params$.next({ ...this.params$.getValue(), sortField });
    this.recomputeVisibleAlbums();
  }

  setSortDir(sortDir: ArtistDetailParams["sortDir"]) {
    // Busca/ordenacao sao locais e nao disparam carga remota.
    this.params$.next({ ...this.params$.getValue(), sortDir });
    this.recomputeVisibleAlbums();
  }

  loadData(force = false): void {
    if (!force && this.loading$.getValue()) return;

    const now = Date.now();
    const key = JSON.stringify(this.params$.getValue());

    // evita "dobro" dentro de ~500ms (StrictMode DEV / double click / remount)
    if (!force && this.lastLoadKey === key && now - this.lastLoadAtMs < 500) {
      return;
    }
    this.lastLoadKey = key;
    this.lastLoadAtMs = now;

    this.refresh$.next();
  }

  refresh() {
    this.loadData(true);
  }

  async addAlbumToArtist(
    payload: { titulo: string; ano?: number },
    files?: File[],
  ): Promise<Album | null> {
    const artistId = this.params$.getValue().artistId;
    if (!artistId) return null;

    const previousAlbums = this.data$.getValue().albums ?? [];
    const previousIds = new Set(previousAlbums.map((album) => album.id));

    this.loading$.next(true);
    this.error$.next(null);
    try {
      const artist = await artistsService.addAlbum(artistId, payload);
      const albums = artist.albuns ?? [];
      // Nao assumir ordem do backend; identificar album criado de forma segura.
      const created = this.findCreatedAlbum(albums, previousIds, payload);
      if (created?.id && files?.length) {
        await uploadAlbumImages(created.id, files);
      }
      this.data$.next({
        artist,
        albums,
        visibleAlbums: sortAlbums(albums, this.params$.getValue()),
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
    const state = this.data$.getValue();
    const params = this.params$.getValue();
    this.data$.next({
      ...state,
      visibleAlbums: sortAlbums(state.albums, params),
    });
  }

  private async loadRequest(params: ArtistDetailParams) {
    if (!params.artistId) {
      this.data$.next(EMPTY_DATA);
      return { ok: true } as const;
    }

    if (this.inFlightKey) {
      this.pendingKey = String(params.artistId);
      return { skipped: true } as const;
    }

    this.inFlightKey = String(params.artistId);
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
    } finally {
      const finishedKey = this.inFlightKey;
      this.inFlightKey = null;
      const pendingKey = this.pendingKey;
      this.pendingKey = null;
      if (pendingKey && pendingKey !== finishedKey) {
        this.loadData(true);
      }
    }
  }

  private findCreatedAlbum(
    albums: Album[],
    previousIds: Set<number>,
    payload: { titulo: string; ano?: number },
  ): Album | null {
    const byDiff = albums.filter(
      (album) => album.id != null && !previousIds.has(album.id),
    );
    if (byDiff.length === 1) return byDiff[0];

    const title = payload.titulo.trim().toLowerCase();
    const byPayload = albums.filter((album) => {
      if (album.titulo?.trim().toLowerCase() !== title) return false;
      if (payload.ano == null) return album.ano == null;
      return album.ano === payload.ano;
    });

    return byPayload.length === 1 ? byPayload[0] : null;
  }
}

export const artistDetailFacade = new ArtistDetailFacade();
