import { BaseFacade } from './base.facade';
import { getAlbuns, Album } from '../services/albunsService';
import { Page } from '../types/Page';

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

    constructor() {
        super(INITIAL_PAGE);
    }

    async fetch(page = 0, size = 10) {
        const cacheKey = `${page}-${size}`;
        const cached = this.cache.get(cacheKey);

        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
            this.setData(cached.data);
            return;
        }

        try {
            this.setLoading(true);
            const data = await getAlbuns(page, size);
            this.cache.set(cacheKey, { data, timestamp: Date.now() });
            this.setData(data);
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'Erro ao carregar álbuns';
            this.setError(errorMessage);
        } finally {
            this.setLoading(false);
        }
    }

    invalidateCache() {
        this.cache.clear();
    }
}

export const albunsFacade = new AlbunsFacade();
