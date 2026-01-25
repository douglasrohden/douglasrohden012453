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
    uploadArtistImages,
} from "../services/artistsService";
import { type Page } from "../types/Page";

type ArtistsParams = {
    page: number;
    size: number;
    search: string;
    sort: "nome";
    dir: "asc" | "desc";
    tipo: string;
};

const INITIAL_PAGE: Page<Artista> = {
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

const INITIAL_PARAMS: ArtistsParams = {
    page: 0,
    size: 10,
    search: "",
    sort: "nome",
    dir: "asc",
    tipo: "TODOS",
};

function isSameParams(a: ArtistsParams, b: ArtistsParams): boolean {
    return (
        a.page === b.page &&
        a.size === b.size &&
        a.search === b.search &&
        a.sort === b.sort &&
        a.dir === b.dir &&
        a.tipo === b.tipo
    );
}

export class ArtistsFacade {
    readonly data$ = new BehaviorSubject<Page<Artista>>(INITIAL_PAGE);
    readonly loading$ = new BehaviorSubject<boolean>(false);
    readonly error$ = new BehaviorSubject<string | null>(null);
    readonly params$ = new BehaviorSubject<ArtistsParams>(INITIAL_PARAMS);

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
                    this.data$.next(result.data);
                    return;
                }

                const status = getHttpStatus(result.error);
                if (status !== 429) {
                    this.error$.next(
                        getErrorMessage(result.error, "Erro ao carregar artistas"),
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
        const trimmed = search.trim();
        this.updateParams({ search: trimmed, page: 0 });
    }

    setPage(page: number) {
        this.updateParams({ page });
    }

    setPageSize(size: number) {
        this.updateParams({ size, page: 0 });
    }

    setSortDir(dir: "asc" | "desc") {
        this.updateParams({ dir });
    }

    setTipo(tipo: string) {
        this.updateParams({ tipo, page: 0 });
    }

    refresh() {
        this.refresh$.next(this.refresh$.getValue() + 1);
    }

    load() {
        this.refresh();
    }

    async create(
        payload: { nome: string; tipo?: string; albumIds?: number[] },
        files?: File[],
    ): Promise<Artista> {
        this.loading$.next(true);
        this.error$.next(null);
        try {
            const artista = await artistsService.create(payload);
            if (files?.length) {
                await uploadArtistImages(artista.id, files);
            }
            this.refresh();
            return artista;
        } catch (err) {
            const message = getErrorMessage(err, "Erro ao criar artista");
            this.error$.next(message);
            throw err;
        } finally {
            this.loading$.next(false);
        }
    }

    async update(
        id: number,
        payload: { nome: string; tipo?: string },
        files?: File[],
    ): Promise<Artista> {
        this.loading$.next(true);
        this.error$.next(null);
        try {
            const updated = await artistsService.update(id, payload);
            if (files?.length) {
                await uploadArtistImages(id, files);
            }
            this.patchArtist(updated);
            // If images were uploaded, we might want to refresh to ensure any image count/list is updated if we tracked that.
            // But patchArtist only updates local state of the text fields.
            // Let's safe-guard by just returning the updated object.
            // Actually, if we want to reflect "new images available", we might need to refresh just like create does.
            // create calls this.refresh().
            // Let's call refresh here too if files were uploaded, or maybe always to be safe?
            if (files?.length) {
                this.refresh();
            }
            return updated;
        } catch (err) {
            const message = getErrorMessage(err, "Erro ao atualizar artista");
            this.error$.next(message);
            throw err;
        } finally {
            this.loading$.next(false);
        }
    }

    patchArtist(updated: Artista) {
        const current = this.data$.getValue();
        if (!current?.content?.length) return;

        const nextContent = current.content.map((item) =>
            item.id === updated.id ? { ...item, ...updated } : item,
        );

        this.data$.next({ ...current, content: nextContent });
    }

    private updateParams(partial: Partial<ArtistsParams>) {
        const current = this.params$.getValue();
        const next = { ...current, ...partial };
        if (!isSameParams(current, next)) {
            this.params$.next(next);
        }
    }

    private async loadRequest(params: ArtistsParams) {
        this.loading$.next(true);
        this.error$.next(null);
        try {
            const data = await artistsService.getAll(
                params.page,
                params.size,
                params.search,
                params.sort,
                params.dir,
                params.tipo,
            );
            return { ok: true, data } as const;
        } catch (error) {
            return { ok: false, error } as const;
        }
    }
}

export const artistsFacade = new ArtistsFacade();
