import { BaseFacade } from './base.facade';
import { getAlbuns } from '../services/albunsService';

export class AlbunsFacade extends BaseFacade<any[]> {
    constructor() {
        super([]);
    }

    async fetch(page = 0, size = 100) {
        try {
            this.setLoading(true);
            const data = await getAlbuns(page, size);
            this.setData(data.content);
        } catch (e: any) {
            this.setError(e?.message ?? 'Erro ao carregar álbuns');
        } finally {
            this.setLoading(false);
        }
    }
}

export const albunsFacade = new AlbunsFacade();
