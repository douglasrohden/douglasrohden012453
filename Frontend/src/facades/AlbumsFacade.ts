import {
    BehaviorSubject,
    combineLatest,
    debounceTime,
    from,
    switchMap,
} from "rxjs";
import {
    createAlbum as createAlbumRequest,
    getAlbuns,
    type Album,
    type GetAlbunsFilters,
    updateAlbum as updateAlbumRequest,
    uploadAlbumImages,
} from "../services/albunsService";
import { type Page } from "../types/Page";
import { getErrorMessage, getHttpStatus } from "../lib/http";

type AlbumParams = {
    page: number;
    size: number;
    search: string;
    sortField: "titulo" | "ano";
    sortDir: "asc" | "desc";
    artistName?: string;
    artistType?: string;
};

const INITIAL_PAGE: Page<Album> = {
    content: [],
    totalPages: 0,
    totalElements: 0,
    last: true,
    size: 10,
    number: 0,
    sort: { empty: true, sorted: false, unsorted: true },
    numberOfElements: 0,
    first: true,
    empty: true,
};

const INITIAL_PARAMS: AlbumParams = {
    page: 0,
    size: 10,
    search: "",
    sortField: "titulo",
    sortDir: "asc",
    artistName: undefined,
    artistType: undefined,
};

function isSameParams(a: AlbumParams, b: AlbumParams): boolean {
    return (
        a.page === b.page &&
        a.size === b.size &&
        a.search === b.search &&
        a.sortField === b.sortField &&
        a.sortDir === b.sortDir &&
        a.artistName === b.artistName &&
        a.artistType === b.artistType
    );
}

function applySort(data: Page<Album>, params: AlbumParams): Page<Album> {
    const sorted = [...(data.content ?? [])].sort((a, b) => {
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

    return {
        ...data,
        content: params.sortDir === "asc" ? sorted : sorted.reverse(),
    };
}

function buildFilters(params: AlbumParams): GetAlbunsFilters {
    const filters: GetAlbunsFilters = {};
    if (params.search.trim()) filters.titulo = params.search.trim();
    if (params.artistName) filters.artistaNome = params.artistName;
    if (params.artistType) filters.artistaTipo = params.artistType;
    return filters;
}

export class AlbumsFacade {
    readonly data$ = new BehaviorSubject<Page<Album>>(INITIAL_PAGE);
    readonly loading$ = new BehaviorSubject<boolean>(false);
    readonly error$ = new BehaviorSubject<string | null>(null);
    readonly params$ = new BehaviorSubject<AlbumParams>(INITIAL_PARAMS);

    private readonly refresh$ = new BehaviorSubject<number>(0);

    constructor() {
        combineLatest([this.params$, this.refresh$])
            .pipe(
                debounceTime(250),
                switchMap(([params]) => from(this.loadRequest(params))),
            )
            .subscribe((result) => {
                this.loading$.next(false);
                if (result.ok) {
                    this.data$.next(applySort(result.data, this.params$.getValue()));
                    return;
                }

                const status = getHttpStatus(result.error);
                if (status !== 429) {
                    this.error$.next(
                        getErrorMessage(result.error, "Erro ao carregar albuns"),
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

    setQuery(search: string) {
        this.updateParams({ search: search.trim(), page: 0 });
    }

    setPage(page: number) {
        this.updateParams({ page });
    }

    setPageSize(size: number) {
        this.updateParams({ size, page: 0 });
    }

    setSortField(sortField: AlbumParams["sortField"]) {
        this.updateParams({ sortField });
    }

    setSortDir(sortDir: AlbumParams["sortDir"]) {
        this.updateParams({ sortDir });
    }

    setArtistName(artistName?: string) {
        this.updateParams({ artistName: artistName?.trim() || undefined, page: 0 });
    }

    setArtistType(artistType?: string) {
        this.updateParams({ artistType: artistType || undefined, page: 0 });
    }

    refresh() {
        this.refresh$.next(this.refresh$.getValue() + 1);
    }

    load() {
        this.refresh();
    }

    async createAlbum(
        payload: {
            titulo: string;
            ano?: number;
            artistaIds?: number[];
            individual?: boolean;
        },
        files?: File[],
    ): Promise<Album | Album[]> {
        this.loading$.next(true);
        this.error$.next(null);
        try {
            const created = await createAlbumRequest(payload);
            const albums = Array.isArray(created) ? created : [created];

            if (files?.length) {
                await Promise.all(
                    albums.map((album) =>
                        album.id ? uploadAlbumImages(album.id, files) : Promise.resolve(),
                    ),
                );
            }

            this.refresh();
            return created;
        } catch (err) {
            const message = getErrorMessage(err, "Erro ao criar album");
            this.error$.next(message);
            throw err;
        } finally {
            this.loading$.next(false);
        }
    }

    async updateAlbum(
        albumId: number,
        payload: { titulo: string; ano?: number },
    ): Promise<Album> {
        this.loading$.next(true);
        this.error$.next(null);
        try {
            const updated = await updateAlbumRequest(albumId, payload);
            this.updateAlbumInState(updated);
            return updated;
        } catch (err) {
            const message = getErrorMessage(err, "Erro ao atualizar album");
            this.error$.next(message);
            throw err;
        } finally {
            this.loading$.next(false);
        }
    }

    updateAlbumInState(updated: Album) {
        const current = this.data$.getValue();
        if (!current?.content?.length) return;

        const nextContent = current.content.map((album) =>
            album.id === updated.id ? { ...album, ...updated } : album,
        );

        this.data$.next({ ...current, content: nextContent });
    }

    private updateParams(partial: Partial<AlbumParams>) {
        const current = this.params$.getValue();
        const next = { ...current, ...partial };
        if (!isSameParams(current, next)) {
            this.params$.next(next);
        }
    }

    private async loadRequest(params: AlbumParams) {
        this.loading$.next(true);
        this.error$.next(null);
        try {
            const filters = buildFilters(params);
            const data = await getAlbuns(params.page, params.size, filters);
            return { ok: true, data } as const;
        } catch (error) {
            return { ok: false, error } as const;
        }
    }
}

export const albumsFacade = new AlbumsFacade();

// compat: import legado
export const albunsFacade = albumsFacade;
