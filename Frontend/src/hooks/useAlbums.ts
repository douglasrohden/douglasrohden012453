import { useEffect, useMemo, useState } from "react";
import { AlbumsFacade } from "./albumsFacade";
import type { Album } from "../services/albunsService";

function useBehaviorSubjectValue<T>(subject: {
    getValue: () => T;
    subscribe: (fn: (v: T) => void) => { unsubscribe: () => void };
}) {
    const [value, setValue] = useState(subject.getValue());
    useEffect(() => {
        const sub = subject.subscribe(setValue);
        return () => sub.unsubscribe();
    }, [subject]);
    return value;
}

export function useAlbums(searchQuery: string) {
    const facade = useMemo(() => new AlbumsFacade(), []);

    useEffect(() => {
        facade.setQuery(searchQuery);
    }, [facade, searchQuery]);

    const albums = useBehaviorSubjectValue<Album[]>(facade.albums$);
    const loading = useBehaviorSubjectValue<boolean>(facade.loading$);
    const error = useBehaviorSubjectValue<string | null>(facade.error$);

    return { albums, loading, error };
}
