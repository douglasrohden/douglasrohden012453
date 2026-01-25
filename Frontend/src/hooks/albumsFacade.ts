import { BehaviorSubject, debounceTime, distinctUntilChanged } from "rxjs";
import { searchAlbums, type Album } from "../services/albunsService";

export class AlbumsFacade {
  private query$ = new BehaviorSubject<string>("");

  readonly albums$ = new BehaviorSubject<Album[]>([]);
  readonly loading$ = new BehaviorSubject<boolean>(false);
  readonly error$ = new BehaviorSubject<string | null>(null);

  constructor() {
    this.query$
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((q) => this.load(q));
  }

  setQuery(q: string) {
    this.query$.next(q);
  }

  private async load(raw: string) {
    const q = raw.trim();

    if (!q) {
      this.albums$.next([]);
      this.error$.next(null);
      this.loading$.next(false);
      return;
    }

    this.loading$.next(true);
    this.error$.next(null);

    try {
      const res = await searchAlbums(q);
      this.albums$.next(res.content);
    } catch {
      this.albums$.next([]);
      this.error$.next("Erro ao buscar álbuns");
    } finally {
      this.loading$.next(false);
    }
  }
}
