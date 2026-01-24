import { BaseFacade } from './base.facade';
import { getAlbuns, Album } from '../services/albunsService';
import { Page } from '../types/Page';
import { getErrorMessage, getHttpStatus } from '../api/client';

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
    empty: true
};

export class AlbunsFacade extends BaseFacade<Page<Album>> {
    private inFlight = new Map<string, Promise<void>>();

    constructor() {
        super(INITIAL_PAGE);
    }

    async fetch(page = 0, size = 10) {
        const cacheKey = `${page}-${size}`;
        const pending = this.inFlight.get(cacheKey);
        if (pending) {
            await pending;
            return;
        }

        const job = (async () => {
            try {
                this.setLoading(true);
                const data = await getAlbuns(page, size);
                this.setData(data);
            } catch (e) {
                const status = getHttpStatus(e);

                // For 429 rate limit, don't set error state - keep previous data visible.
                // The global toast (via apiRateLimitEvents) already shows the rate limit message.
                if (status === 429) {
                    console.debug('[AlbunsFacade] Rate limited, keeping previous data visible');
                    // Sem retry automático: o backend controla o rate limit (edital).
                } else {
                    const errorMessage = getErrorMessage(e, 'Erro ao carregar álbuns');
                    this.setError(errorMessage);
                }
            } finally {
                this.setLoading(false);
                this.inFlight.delete(cacheKey);
            }
        })();

        this.inFlight.set(cacheKey, job);
        await job;
    }

    invalidateCache() {
        // Mantido apenas para compatibilidade com testes/consumidores.
        // Não há cache local de dados na facade.
    }
}

export const albunsFacade = new AlbunsFacade();
