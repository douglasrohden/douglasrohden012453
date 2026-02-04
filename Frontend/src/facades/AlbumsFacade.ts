import { BehaviorSubject } from "rxjs";
import {
    createAlbum as apiCreate,
    getAlbuns,
    updateAlbum as apiUpdate,
    deleteAlbum as apiDelete,
    uploadAlbumImages,
    type Album,
    type GetAlbunsFilters,
} from "../services/albunsService";
import { type Page } from "../types/Page";
import { getErrorMessage, getHttpStatus } from "../lib/http";

type Params = {
    page: number;
    size: number;
    search: string;
    sortField: "titulo" | "ano";
    sortDir: "asc" | "desc";
    artistName?: string;
    artistType?: string;
};

const EMPTY_PAGE: Page<Album> = {
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

const DEFAULT_PARAMS: Params = {
    page: 0,
    size: 10,
    search: "",
    sortField: "titulo",
    sortDir: "asc",
};

export class AlbumsFacade {
    readonly data$ = new BehaviorSubject<Page<Album>>(EMPTY_PAGE);
    readonly loading$ = new BehaviorSubject(false);
    readonly error$ = new BehaviorSubject<string | null>(null);
    readonly params$ = new BehaviorSubject<Params>(DEFAULT_PARAMS);

    private active = false;

    activate() {
        if (this.active) return;
        this.active = true;
        this.load();
    }

    deactivate() {
        this.active = false;
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
        this.setParams({ search: search.trim(), page: 0 });
    }

    setPage(page: number) {
        this.setParams({ page });
    }

    setPageSize(size: number) {
        this.setParams({ size, page: 0 });
    }

    setSortField(sortField: Params["sortField"]) {
        this.setParams({ sortField });
    }

    setSortDir(sortDir: Params["sortDir"]) {
        this.setParams({ sortDir });
    }

    setArtistName(artistName?: string) {
        this.setParams({ artistName: artistName?.trim() || undefined, page: 0 });
    }

    setArtistType(artistType?: string) {
        this.setParams({ artistType: artistType || undefined, page: 0 });
    }

    private setParams(partial: Partial<Params>) {
        this.params$.next({ ...this.params$.getValue(), ...partial });
        this.load();
    }

    async load() {
        const p = this.params$.getValue();
        const filters: GetAlbunsFilters = {};
        if (p.search.length >= 2) filters.titulo = p.search;
        if (p.artistName) filters.artistaNome = p.artistName;
        if (p.artistType) filters.artistaTipo = p.artistType;

        this.loading$.next(true);
        this.error$.next(null);
        try {
            const data = await getAlbuns(p.page, p.size, filters, {
                sortField: p.sortField,
                sortDir: p.sortDir,
            });
            this.data$.next(data);
        } catch (err) {
            if (getHttpStatus(err) !== 429) {
                this.error$.next(getErrorMessage(err, "Erro ao carregar álbuns"));
            }
        } finally {
            this.loading$.next(false);
        }
    }

    async createAlbum(
        payload: { titulo: string; ano?: number; artistaIds?: number[]; individual?: boolean },
        files?: File[],
    ) {
        this.loading$.next(true);
        try {
            const created = await apiCreate(payload);
            const albums = Array.isArray(created) ? created : [created];
            if (files?.length) {
                await Promise.all(albums.map((a) => a.id && uploadAlbumImages(a.id, files)));
            }
            this.load();
            return created;
        } catch (err) {
            this.error$.next(getErrorMessage(err, "Erro ao criar álbum"));
            throw err;
        } finally {
            this.loading$.next(false);
        }
    }

    async updateAlbum(id: number, payload: { titulo: string; ano?: number }) {
        this.loading$.next(true);
        try {
            const updated = await apiUpdate(id, payload);
            const current = this.data$.getValue();
            const content = current.content.map((a) => (a.id === id ? { ...a, ...updated } : a));
            this.data$.next({ ...current, content });
            return updated;
        } catch (err) {
            this.error$.next(getErrorMessage(err, "Erro ao atualizar álbum"));
            throw err;
        } finally {
            this.loading$.next(false);
        }
    }

    async deleteAlbum(id: number) {
        this.loading$.next(true);
        try {
            await apiDelete(id);
            const current = this.data$.getValue();
            this.data$.next({ ...current, content: current.content.filter((a) => a.id !== id) });
            this.load();
        } catch (err) {
            this.error$.next(getErrorMessage(err, "Erro ao excluir álbum"));
            throw err;
        } finally {
            this.loading$.next(false);
        }
    }

    refresh() {
        this.load();
    }

    updateAlbumInState(updated: Album) {
        const current = this.data$.getValue();
        const content = current.content.map((a) => (a.id === updated.id ? { ...a, ...updated } : a));
        this.data$.next({ ...current, content });
    }
}

export const albumsFacade = new AlbumsFacade();
