import { BaseFacade } from './base.facade';
import { getAlbuns, Album } from '../services/albunsService';
import { Page } from '../types/Page';
import { getErrorMessage } from '../api/client';

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

interface CacheEntry {
    data: Page<Album>;
    timestamp: number;
}

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export class AlbunsFacade extends BaseFacade<Page<Album>> {
    private cache = new Map<string, CacheEntry>();
    private inFlight = new Map<string, Promise<void>>();

    constructor() {
        super(INITIAL_PAGE);
    }

    async fetch(page = 0, size = 10) {
        const cacheKey = `${page}-${size}`;
        const cached = this.cache.get(cacheKey);

        const pending = this.inFlight.get(cacheKey);
        if (pending) {
            await pending;
            return;
        }

        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
            this.setData(cached.data);
            return;
        }

        const job = (async () => {
            try {
                this.setLoading(true);
                const data = await getAlbuns(page, size);
                this.cache.set(cacheKey, { data, timestamp: Date.now() });
                this.setData(data);
            } catch (e) {
                const errorMessage = getErrorMessage(e, 'Erro ao carregar álbuns');
                this.setError(errorMessage);
            } finally {
                this.setLoading(false);
                this.inFlight.delete(cacheKey);
            }
        })();

        this.inFlight.set(cacheKey, job);
        await job;
    }

    invalidateCache() {
        this.cache.clear();
    }
}

export const albunsFacade = new AlbunsFacade();
