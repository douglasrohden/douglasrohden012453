import { BehaviorSubject, Observable } from 'rxjs';

/**
 * BaseStore - Classe abstrata para stores genéricos
 * Fornece funcionalidade comum para todos os stores
 */
export abstract class BaseStore<T> {
    protected readonly _state$: BehaviorSubject<T>;

    constructor(initialState: T) {
        this._state$ = new BehaviorSubject<T>(initialState);
    }

    /**
     * Observable do estado
     */
    get state$(): Observable<T> {
        return this._state$.asObservable();
    }

    /**
     * Obtém o estado atual (snapshot)
     */
    get currentState(): T {
        return this._state$.getValue();
    }

    /**
     * Atualiza o estado
     */
    setState(partialState: Partial<T>): void {
        const newState = { ...this.currentState, ...partialState } as T;
        this._state$.next(newState);
    }

    /**
     * Reseta o estado para o inicial
     */
    abstract reset(): void;
}
