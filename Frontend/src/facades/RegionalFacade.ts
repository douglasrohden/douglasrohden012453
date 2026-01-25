import { BehaviorSubject } from "rxjs";
import { getErrorMessage } from "../lib/http";
import { type Regional, regionalService } from "../services/regionalService";

export class RegionalFacade {
    readonly data$ = new BehaviorSubject<Regional[]>([]);
    readonly loading$ = new BehaviorSubject<boolean>(false);
    readonly error$ = new BehaviorSubject<string | null>(null);

    constructor() {
        this.load();
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
            this.error$.next(getErrorMessage(error, "Erro ao carregar regionais"));
        } finally {
            this.loading$.next(false);
        }
    }
}

export const regionalFacade = new RegionalFacade();
