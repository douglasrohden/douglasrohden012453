import { BaseFacade } from './base.facade';
import { artistsService, type Artista } from '../services/artistsService';
import { type Page } from '../types/Page';
import { getErrorMessage, getHttpStatus } from '../api/client';

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
    empty: true
};

type FetchArgs = {
    page?: number;
    size?: number;
    search?: string;
    dir?: 'asc' | 'desc';
    tipo?: string;
};

export class ArtistasFacade extends BaseFacade<Page<Artista>> {
    private inFlight = new Map<string, Promise<void>>();

    constructor() {
        super(INITIAL_PAGE);
    }

    async fetch(args: FetchArgs = {}) {
        const page = args.page ?? 0;
        const size = args.size ?? 10;
        const search = args.search ?? '';
        const dir = args.dir ?? 'asc';
        const tipo = args.tipo ?? 'TODOS';

        const key = `${page}|${size}|${search}|${dir}|${tipo}`;
        const pending = this.inFlight.get(key);
        if (pending) {
            await pending;
            return;
        }

        const job = (async () => {
            try {
                this.setLoading(true);
                const data = await artistsService.getAll(page, size, search, 'nome', dir, tipo);
                this.setData(data);
            } catch (e) {
                const status = getHttpStatus(e);

                // For 429 rate limit, don't set error state - keep previous data visible.
                // The global toast (via apiRateLimitEvents) already shows the rate limit message.
                if (status === 429) {
                    console.debug('[ArtistasFacade] Rate limited, keeping previous data visible');
                    // Sem retry automático: o backend controla o rate limit (edital).
                } else {
                    const errorMessage = getErrorMessage(e, 'Erro ao carregar artistas');
                    this.setError(errorMessage);
                }
            } finally {
                this.setLoading(false);
                this.inFlight.delete(key);
            }
        })();

        this.inFlight.set(key, job);
        await job;
    }

    clearError() {
        this.setError(null);
    }
}

export const artistasFacade = new ArtistasFacade();
