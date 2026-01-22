import { useState, useEffect, useMemo, useCallback } from "react";
import { useDebounce } from "./useDebounce";
import { useLocation } from "react-router-dom";
import { Artista, artistsService } from "../services/artistsService";
import { Page } from "../types/Page";
import { useToast } from "../contexts/ToastContext";
import { getErrorMessage, getHttpStatus } from "../api/client";

let lastFetchKey = "";
let lastFetchAtMs = 0;

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

    // State
    const [artists, setArtists] = useState<Artista[]>([]);
    const [pageData, setPageData] = useState<Page<Artista> | null>(null);
    const [loading, setLoading] = useState(true);
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

    // Fetch Data
    const fetchArtists = useCallback(async () => {
        const fetchKey = `${page}|${size}|${debouncedSearch}|${dir}|${tipo}`;
        const now = Date.now();

        // React 18 StrictMode (dev) mounts/unmounts components twice; without a guard,
        // this can look like a single click but produce duplicate API calls.
        if (import.meta.env.DEV && fetchKey === lastFetchKey && now - lastFetchAtMs < 800) {
            return;
        }
        lastFetchKey = fetchKey;
        lastFetchAtMs = now;

        setLoading(true);
        try {
            const data = await artistsService.getAll(page, size, debouncedSearch, "nome", dir, tipo);
            setArtists(data.content);
            setPageData(data);
        } catch (error) {
            console.error("Failed to fetch artists", error);
            const status = getHttpStatus(error);
            const msg = getErrorMessage(error, "Falha ao carregar artistas");
            // 429 already triggers a global warning toast
            if (status !== 429) addToast(msg, "error");
        } finally {
            setLoading(false);
        }
    }, [page, size, debouncedSearch, dir, tipo, addToast]);

    // Trigger fetch on dependencies
    useEffect(() => {
        fetchArtists();
    }, [fetchArtists, location.key]);

    const totalPages = useMemo(() => pageData?.totalPages ?? 0, [pageData]);

    return {
        artists,
        loading,
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
