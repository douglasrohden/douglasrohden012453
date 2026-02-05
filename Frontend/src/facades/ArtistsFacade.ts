import { BehaviorSubject } from "rxjs";
import { getErrorMessage, getHttpStatus } from "../lib/http";
import { artistsService, type Artista, uploadArtistImages } from "../services/artistsService";
import { artistImagesFacade } from "./ArtistImagesFacade";
import { artistDetailFacade } from "./ArtistDetailFacade";
import { type Page } from "../types/Page";

type Params = {
    page: number;
    size: number;
    search: string;
    sort: "nome";
    dir: "asc" | "desc";
    tipo: string;
};

const EMPTY_PAGE: Page<Artista> = {
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
    sort: "nome",
    dir: "asc",
    tipo: "TODOS",
};

export class ArtistsFacade {
    readonly data$ = new BehaviorSubject<Page<Artista>>(EMPTY_PAGE);
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

    setSortDir(dir: "asc" | "desc") {
        this.setParams({ dir });
    }

    setTipo(tipo: string) {
        this.setParams({ tipo, page: 0 });
    }

    private setParams(partial: Partial<Params>) {
        this.params$.next({ ...this.params$.getValue(), ...partial });
        this.load();
    }

    async load() {
        const p = this.params$.getValue();
        this.loading$.next(true);
        this.error$.next(null);
        try {
            const data = await artistsService.getAll(p.page, p.size, p.search, p.sort, p.dir, p.tipo);
            this.data$.next(data);
        } catch (err) {
            if (getHttpStatus(err) !== 429) {
                this.error$.next(getErrorMessage(err, "Erro ao carregar artistas"));
            }
        } finally {
            this.loading$.next(false);
        }
    }

    async create(payload: { nome: string; tipo?: string; albumIds?: number[] }, files?: File[]) {
        this.loading$.next(true);
        try {
            const artista = await artistsService.create(payload);
            if (files?.length) await uploadArtistImages(artista.id, files);
            this.load();
            return artista;
        } catch (err) {
            this.error$.next(getErrorMessage(err, "Erro ao criar artista"));
            throw err;
        } finally {
            this.loading$.next(false);
        }
    }

    async update(id: number, payload: { nome: string; tipo?: string }, files?: File[]) {
        this.loading$.next(true);
        try {
            const updated = await artistsService.update(id, payload);

            // Se houver upload de imagens, reutiliza facade para limpar cache e obter URLs atualizadas.
            let firstImageUrl: string | undefined;
            if (files?.length) {
                const images = await artistImagesFacade.upload(id, files);
                firstImageUrl = images[0]?.url;
            }

            const current = this.data$.getValue();
            const content = current.content.map((a) =>
                a.id === id ? { ...a, ...updated, imageUrl: firstImageUrl ?? a.imageUrl } : a,
            );
            this.data$.next({ ...current, content });

            // Atualiza detalhe do artista se a tela estiver aberta.
            artistDetailFacade.patchArtist({ ...updated, imageUrl: firstImageUrl });

            return { ...updated, imageUrl: firstImageUrl ?? updated.imageUrl };
        } catch (err) {
            this.error$.next(getErrorMessage(err, "Erro ao atualizar artista"));
            throw err;
        } finally {
            this.loading$.next(false);
        }
    }

    async delete(id: number) {
        this.loading$.next(true);
        try {
            await artistsService.delete(id);
            const current = this.data$.getValue();
            this.data$.next({ ...current, content: current.content.filter((a) => a.id !== id) });
            this.load();
        } catch (err) {
            this.error$.next(getErrorMessage(err, "Erro ao excluir artista"));
            throw err;
        } finally {
            this.loading$.next(false);
        }
    }

    patchArtist(updated: Artista) {
        const current = this.data$.getValue();
        const content = current.content.map((a) => (a.id === updated.id ? { ...a, ...updated } : a));
        this.data$.next({ ...current, content });
    }

    refresh() {
        this.load();
    }
}

export const artistsFacade = new ArtistsFacade();
