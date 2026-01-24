import { BehaviorSubject, Observable } from 'rxjs';
import { ArtistImage, getArtistImages } from '../services/artistsService';
import { getErrorMessage, getHttpStatus } from '../api/client';

export type ArtistImagesState =
    | { status: 'idle' }
    | { status: 'loading' }
    | { status: 'ready'; data: ArtistImage[] }
    | { status: 'error'; message: string; retryAfter?: number };

class ArtistImagesFacade {
    private readonly subjects = new Map<number, BehaviorSubject<ArtistImagesState>>();
    private readonly cache = new Map<number, { data: ArtistImage[]; expiresAt: number }>();
    private readonly inFlight = new Map<number, Promise<ArtistImage[]>>();
    private readonly cacheTtlMs = 5 * 60 * 1000; // 5 minutos

    state$(artistaId: number): Observable<ArtistImagesState> {
        return this.subject(artistaId).asObservable();
    }

    snapshot(artistaId: number): ArtistImagesState {
        return this.subject(artistaId).getValue();
    }

    async load(artistaId: number): Promise<ArtistImage[]> {
        const now = Date.now();
        const cached = this.cache.get(artistaId);
        if (cached && cached.expiresAt > now) {
            this.subject(artistaId).next({ status: 'ready', data: cached.data });
            return cached.data;
        }

        const pending = this.inFlight.get(artistaId);
        if (pending) return pending;

        const job = (async () => {
            this.subject(artistaId).next({ status: 'loading' });
            try {
                const data = await getArtistImages(artistaId);
                this.cache.set(artistaId, { data, expiresAt: now + this.cacheTtlMs });
                this.subject(artistaId).next({ status: 'ready', data });
                return data;
            } catch (err) {
                const status = getHttpStatus(err);
                const retryAfter = typeof (err as any)?.response?.data?.retryAfter === 'number'
                    ? (err as any).response.data.retryAfter
                    : undefined;
                const message = getErrorMessage(err, 'Erro ao carregar imagens do artista');
                if (status === 429 && retryAfter) {
                    this.subject(artistaId).next({ status: 'error', message, retryAfter });
                } else {
                    this.subject(artistaId).next({ status: 'error', message });
                }
                throw err;
            } finally {
                this.inFlight.delete(artistaId);
            }
        })();

        this.inFlight.set(artistaId, job);
        return job;
    }

    private subject(artistaId: number): BehaviorSubject<ArtistImagesState> {
        let subj = this.subjects.get(artistaId);
        if (!subj) {
            subj = new BehaviorSubject<ArtistImagesState>({ status: 'idle' });
            this.subjects.set(artistaId, subj);
        }
        return subj;
    }
}

export const artistImagesFacade = new ArtistImagesFacade();
