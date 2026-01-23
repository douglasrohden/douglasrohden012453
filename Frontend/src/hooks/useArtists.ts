import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useDebounce } from "./useDebounce";
import { useLocation } from "react-router-dom";
import { Artista } from "../services/artistsService";
import { useToast } from "../contexts/ToastContext";
import { useObservable } from "./useObservable";
import { artistasFacade } from "../facades/artistas.facade";

interface UseArtistsReturn {
    artists: Artista[];
    loading: boolean;
    page: number;
    totalPages: number;
    search: string;
    tipo: string;
    dir: "asc" | "desc";
    setPage: (page: number) => void;
    setSearch: (search: string) => void;
    setTipo: (tipo: string) => void;
    setDir: (dir: "asc" | "desc") => void;
    refresh: () => void;
}

export function useArtists(): UseArtistsReturn {
    const { addToast } = useToast();
    const location = useLocation();
    const lastToastErrorRef = useRef<string | null>(null);

    const state = useObservable(artistasFacade.state$, artistasFacade.snapshot);

    // UI State (filters)
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(0);
    const [dir, setDir] = useState<"asc" | "desc">("asc");
    const [tipo, setTipo] = useState<string>("TODOS");

    // Constants
    const size = 10;
    // Debounce search
    const debouncedSearch = useDebounce(search, 300);

    // Reset page on filter change
    useEffect(() => {
        setPage(0);
    }, [debouncedSearch, tipo]);

    const fetchArtists = useCallback(() => {
        return artistasFacade.fetch({
            page,
            size,
            search: debouncedSearch,
            dir,
            tipo
        });
    }, [page, size, debouncedSearch, dir, tipo]);

    // Trigger fetch on dependencies
    useEffect(() => {
        fetchArtists();
    }, [fetchArtists, location.key]);

    // Keep HomePage behavior: show non-429 errors as toast
    useEffect(() => {
        if (!state.error) {
            lastToastErrorRef.current = null;
            return;
        }
        if (state.error === lastToastErrorRef.current) return;

        lastToastErrorRef.current = state.error;
        addToast(state.error, "error");
        artistasFacade.clearError();
    }, [state.error, addToast]);

    const totalPages = useMemo(() => state.data?.totalPages ?? 0, [state.data]);

    return {
        artists: state.data?.content ?? [],
        loading: state.loading,
        page,
        totalPages,
        search,
        tipo,
        dir,
        setPage,
        setSearch,
        setTipo,
        setDir,
        refresh: fetchArtists
    };
}
