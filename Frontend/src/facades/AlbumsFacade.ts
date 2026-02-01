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
    skip,
} from "rxjs";
import {
    createAlbum as createAlbumRequest,
    getAlbuns,
    type Album,
    type GetAlbunsFilters,
    updateAlbum as updateAlbumRequest,
    deleteAlbum,
    uploadAlbumImages,
} from "../services/albunsService";
import { type Page } from "../types/Page";
import { getErrorMessage, getHttpStatus, getRateLimitInfo } from "../lib/http";

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

const CACHE_TTL_MS = 15_000;
const LOAD_DEDUPE_MS = 500;
const MIN_QUERY_LENGTH = 2;

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

type ResolvedParams = {
    page: number;
    size: number;
    filters: GetAlbunsFilters;
    sortField: AlbumParams["sortField"];
    sortDir: AlbumParams["sortDir"];
};

export class AlbumsFacade {
    readonly data$ = new BehaviorSubject<Page<Album>>(INITIAL_PAGE);
    readonly loading$ = new BehaviorSubject<boolean>(false);
    readonly error$ = new BehaviorSubject<string | null>(null);
    readonly params$ = new BehaviorSubject<AlbumParams>(INITIAL_PARAMS);

    private readonly refresh$ = new Subject<void>();
    private sub: Subscription | null = null;
    private lastLoadKey: string | null = null;
    private lastLoadAtMs = 0;
    private activeCount = 0;
    private loadingCount = 0;

    private readonly cache = new Map<string, { data: Page<Album>; expiresAt: number }>();
    private readonly inFlight = new Map<string, Promise<Page<Album>>>();
    private currentAbort: AbortController | null = null;
    private currentKey: string | null = null;
    private blockedUntilMs = 0;
    private retryTimer: ReturnType<typeof setTimeout> | null = null;
    private pendingRefresh = false;
    private forceReload = false;

    activate(): void {
        if (this.activeCount > 0) return; // idempotente
        this.activeCount = 1;
        if (this.sub) return; // seguranca extra

        const paramsChanged$ = this.params$.pipe(
            distinctUntilChanged((prev, next) => this.isSameRequestParams(prev, next)),
            skip(1),
            map(() => undefined),
        );

        this.sub = merge(paramsChanged$, this.refresh$)
            .pipe(
                debounceTime(250),
                switchMap(() => from(this.loadRequest(this.params$.getValue()))),
            )
            .subscribe((result) => {
                if ("skipped" in result) return;
                if (result.ok) {
                    this.data$.next(result.data);
                    return;
                }

                const status = getHttpStatus(result.error);
                if (status !== 429) {
                    this.error$.next(getErrorMessage(result.error, "Erro ao carregar albuns"));
                }
            });

        // 1 load inicial
        this.load(true);
    }

    deactivate(): void {
        if (this.activeCount === 0) return;
        this.activeCount = 0;
        this.sub?.unsubscribe();
        this.sub = null;
        this.clearRetryTimer();
        this.abortCurrent();
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

    load(force = false): void {
        if (!force && this.loading$.getValue()) return;

        const now = Date.now();
        const key = this.buildKey(this.resolveParams(this.params$.getValue()));

        // evita "dobro" dentro de ~500ms (StrictMode DEV / double click / remount)
        if (!force && this.lastLoadKey === key && now - this.lastLoadAtMs < LOAD_DEDUPE_MS) {
            return;
        }
        this.lastLoadKey = key;
        this.lastLoadAtMs = now;

        this.refresh$.next();
    }

    refresh() {
        this.forceReload = true;
        this.load(true);
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
        this.setLoading(true);
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

            this.invalidateCache();
            this.refresh();
            return created;
        } catch (err) {
            const status = getHttpStatus(err);
            if (status === 429) {
                this.handleRateLimit(err);
                throw err;
            }
            const message = getErrorMessage(err, "Erro ao criar album");
            this.error$.next(message);
            throw err;
        } finally {
            this.setLoading(false);
        }
    }

    async updateAlbum(
        albumId: number,
        payload: { titulo: string; ano?: number },
    ): Promise<Album> {
        this.setLoading(true);
        this.error$.next(null);
        try {
            const updated = await updateAlbumRequest(albumId, payload);
            this.updateAlbumInState(updated);
            this.invalidateCache();
            return updated;
        } catch (err) {
            const status = getHttpStatus(err);
            if (status === 429) {
                this.handleRateLimit(err);
                throw err;
            }
            const message = getErrorMessage(err, "Erro ao atualizar album");
            this.error$.next(message);
            throw err;
        } finally {
            this.setLoading(false);
        }
    }

    async deleteAlbum(albumId: number): Promise<void> {
        this.setLoading(true);
        this.error$.next(null);
        try {
            await deleteAlbum(albumId);
            const current = this.data$.getValue();
            if (current?.content?.length) {
                const nextContent = current.content.filter((alb) => alb.id !== albumId);
                this.data$.next({ ...current, content: nextContent });
            }
            this.invalidateCache();
            this.refresh();
        } catch (err) {
            const status = getHttpStatus(err);
            if (status === 429) {
                this.handleRateLimit(err);
                throw err;
            }
            const message = getErrorMessage(err, "Erro ao excluir album");
            this.error$.next(message);
            throw err;
        } finally {
            this.setLoading(false);
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
        const resolved = this.resolveParams(params);
        const key = this.buildKey(resolved);
        const now = Date.now();
        const forceReload = this.consumeForceReload();

        if (!forceReload) {
            const cached = this.cache.get(key);
            if (cached && cached.expiresAt > now) {
                this.error$.next(null);
                return { ok: true, data: cached.data, fromCache: true } as const;
            }
        }

        if (!forceReload && now < this.blockedUntilMs) {
            this.scheduleRetry();
            return { skipped: true } as const;
        }

        if (!forceReload) {
            const existing = this.inFlight.get(key);
            if (existing) {
                try {
                    const data = await existing;
                    return { ok: true, data, fromCache: false } as const;
                } catch (error) {
                    if (this.isAbortError(error)) return { skipped: true } as const;
                    const status = getHttpStatus(error);
                    if (status === 429) {
                        this.handleRateLimit(error);
                    }
                    return { ok: false, error } as const;
                }
            }
        }

        if (this.currentAbort && this.currentKey && (this.currentKey !== key || forceReload)) {
            this.currentAbort.abort();
        }

        const controller = new AbortController();
        this.currentAbort = controller;
        this.currentKey = key;

        if (forceReload) {
            this.cache.delete(key);
            this.inFlight.delete(key);
        }

        this.setLoading(true);
        this.error$.next(null);

        const request = getAlbuns(resolved.page, resolved.size, resolved.filters, {
            sortField: resolved.sortField,
            sortDir: resolved.sortDir,
            signal: controller.signal,
        })
            .then((data) => {
                this.cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
                return data;
            })
            .finally(() => {
                this.inFlight.delete(key);
                if (this.currentAbort === controller) {
                    this.currentKey = null;
                    this.currentAbort = null;
                }
                this.setLoading(false);
            });

        this.inFlight.set(key, request);

        try {
            const data = await request;
            return { ok: true, data, fromCache: false } as const;
        } catch (error) {
            if (this.isAbortError(error)) return { skipped: true } as const;
            const status = getHttpStatus(error);
            if (status === 429) {
                this.handleRateLimit(error);
            }
            return { ok: false, error } as const;
        }
    }

    private resolveParams(params: AlbumParams): ResolvedParams {
        const normalizedSearch = this.normalizeSearch(params.search);
        const filters: GetAlbunsFilters = {};
        if (normalizedSearch) filters.titulo = normalizedSearch;
        if (params.artistName?.trim()) filters.artistaNome = params.artistName.trim();
        if (params.artistType) filters.artistaTipo = params.artistType;
        return {
            page: params.page,
            size: params.size,
            filters,
            sortField: params.sortField,
            sortDir: params.sortDir,
        };
    }

    private isSameRequestParams(a: AlbumParams, b: AlbumParams): boolean {
        return this.buildKey(this.resolveParams(a)) === this.buildKey(this.resolveParams(b));
    }

    private buildKey(resolved: ResolvedParams): string {
        return JSON.stringify({
            page: resolved.page,
            size: resolved.size,
            filters: resolved.filters,
            sortField: resolved.sortField,
            sortDir: resolved.sortDir,
        });
    }

    private normalizeSearch(search: string): string {
        const trimmed = search.trim();
        if (trimmed.length < MIN_QUERY_LENGTH) return "";
        return trimmed;
    }

    private setLoading(isLoading: boolean) {
        if (isLoading) {
            this.loadingCount += 1;
        } else {
            this.loadingCount = Math.max(0, this.loadingCount - 1);
        }
        this.loading$.next(this.loadingCount > 0);
    }

    private invalidateCache() {
        this.cache.clear();
    }

    private handleRateLimit(error: unknown) {
        const info = getRateLimitInfo(error);
        const retryAfterSeconds = info?.retryAfter ?? 1;
        const now = Date.now();
        const nextBlock = now + Math.max(1, retryAfterSeconds) * 1000;
        this.blockedUntilMs = Math.max(this.blockedUntilMs, nextBlock);
        this.scheduleRetry();
    }

    private scheduleRetry() {
        if (this.retryTimer) return;
        const now = Date.now();
        if (this.blockedUntilMs <= now) return;
        this.pendingRefresh = true;
        this.retryTimer = setTimeout(() => {
            this.retryTimer = null;
            if (!this.pendingRefresh) return;
            this.pendingRefresh = false;
            this.load(true);
        }, this.blockedUntilMs - now);
    }

    private clearRetryTimer() {
        if (this.retryTimer) {
            clearTimeout(this.retryTimer);
            this.retryTimer = null;
        }
        this.pendingRefresh = false;
    }

    private abortCurrent() {
        if (this.currentAbort) {
            this.currentAbort.abort();
        }
        this.currentAbort = null;
        this.currentKey = null;
    }

    private consumeForceReload(): boolean {
        if (!this.forceReload) return false;
        this.forceReload = false;
        return true;
    }

    private isAbortError(error: unknown): boolean {
        if (!error || typeof error !== "object") return false;
        const err = error as { name?: string; code?: string };
        return err.code === "ERR_CANCELED" || err.name === "CanceledError" || err.name === "AbortError";
    }
}

export const albumsFacade = new AlbumsFacade();

// compat: import legado
export const albunsFacade = albumsFacade;
