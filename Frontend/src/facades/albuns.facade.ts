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

export class AlbunsFacade extends BaseFacade<Page<Album>> {
    constructor() {
        super(INITIAL_PAGE);
    }

    async fetch(page = 0, size = 10) {
        try {
            this.setLoading(true);
            const data = await getAlbuns(page, size);
            this.setData(data);
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'Erro ao carregar álbuns';
            this.setError(errorMessage);
        } finally {
            this.setLoading(false);
        }
    }
}

export const albunsFacade = new AlbunsFacade();
