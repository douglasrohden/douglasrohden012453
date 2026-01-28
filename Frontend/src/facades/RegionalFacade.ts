import { BehaviorSubject } from "rxjs";
import { getErrorMessage, getHttpStatus } from "../lib/http";
import { type Regional, regionalService } from "../services/regionalService";

export class RegionalFacade {
    readonly data$ = new BehaviorSubject<Regional[]>([]);
    readonly loading$ = new BehaviorSubject<boolean>(false);
    readonly error$ = new BehaviorSubject<string | null>(null);
    private activeCount = 0;

    activate(): void {
        if (this.activeCount > 0) return; // idempotente
        this.activeCount = 1;
        this.load();
    }

    deactivate(): void {
        if (this.activeCount === 0) return;
        this.activeCount = 0;
    }

    get snapshot() {
        return {
            data: this.data$.getValue(),
            loading: this.loading$.getValue(),
            error: this.error$.getValue(),
        };
    }

    async load() {
        this.loading$.next(true);
        this.error$.next(null);
        try {
            const data = await regionalService.getAll();
            this.data$.next(data);
        } catch (error) {
            const status = getHttpStatus(error);
            if (status !== 429) {
                this.error$.next(getErrorMessage(error, "Erro ao carregar regionais"));
            }
        } finally {
            this.loading$.next(false);
        }
    }

    async sync() {
        this.loading$.next(true);
        this.error$.next(null);
        try {
            const result = await regionalService.sync();
            await this.load();
            return result;
        } catch (error) {
            const status = getHttpStatus(error);
            if (status !== 429) {
                this.error$.next(getErrorMessage(error, "Erro ao sincronizar regionais"));
            }
            this.loading$.next(false);
            throw error;
        }
    }
}

export const regionalFacade = new RegionalFacade();
