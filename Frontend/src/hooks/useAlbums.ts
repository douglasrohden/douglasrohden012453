import { useState, useEffect, useMemo } from 'react';
import { searchAlbums, Album } from '../services/albunsService';
import { debounce } from 'lodash';

export function useAlbums(searchQuery: string) {
    const [albums, setAlbums] = useState<Album[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const performSearch = useMemo(
        () => debounce(async (query: string) => {
            if (!query.trim()) {
                setAlbums([]);
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const response = await searchAlbums(query);
                setAlbums(response.content);
            } catch {
                setError('Erro ao buscar álbuns');
                setAlbums([]);
            } finally {
                setLoading(false);
            }
        }, 300),
        []
    );

    useEffect(() => {
        performSearch(searchQuery);
        return () => {
            performSearch.cancel();
        };
    }, [searchQuery, performSearch]);

    return { albums, loading, error };
}
