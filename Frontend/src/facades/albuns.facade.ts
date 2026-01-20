import { BaseFacade } from './base.facade';
import { getAlbuns } from '../services/albunsService';

export class AlbunsFacade extends BaseFacade<any[]> {
    constructor() {
        super([]);
    }

    async fetch() {
        try {
            this.setLoading(true);
            const data = await getAlbuns();
            this.setData(data);
        } catch (e: any) {
            this.setError(e?.message ?? 'Erro ao carregar álbuns');
        }
    }
}

export const albunsFacade = new AlbunsFacade();
