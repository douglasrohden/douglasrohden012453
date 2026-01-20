import { BehaviorSubject, Observable } from 'rxjs';

export type ResourceState<T> = {
    data: T | null;
    loading: boolean;
    error: string | null;
};

export class BaseFacade<T> {
    protected subject: BehaviorSubject<ResourceState<T>>;

    constructor(initialData: T | null = null) {
        this.subject = new BehaviorSubject<ResourceState<T>>({
            data: initialData,
            loading: false,
            error: null,
        });
    }

    get state$(): Observable<ResourceState<T>> {
        return this.subject.asObservable();
    }

    get snapshot(): ResourceState<T> {
        return this.subject.getValue();
    }

    protected setLoading(loading: boolean) {
        this.subject.next({ ...this.snapshot, loading });
    }

    protected setData(data: T | null) {
        this.subject.next({ data, loading: false, error: null });
    }

    protected setError(error: string | null) {
        this.subject.next({ ...this.snapshot, error, loading: false });
    }
}
