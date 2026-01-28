import { useEffect } from "react";
import { artistsFacade } from "../facades/ArtistsFacade";
import { useBehaviorSubjectValue } from "./useBehaviorSubjectValue";
import { Artista } from "../services/artistsService";

interface UseArtistsReturn {
  artists: Artista[];
  loading: boolean;
  error: string | null;
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
  useEffect(() => {
    artistsFacade.activate();
    return () => artistsFacade.deactivate();
  }, []);

  const params = useBehaviorSubjectValue(artistsFacade.params$);
  const data = useBehaviorSubjectValue(artistsFacade.data$);
  const loading = useBehaviorSubjectValue(artistsFacade.loading$);
  const error = useBehaviorSubjectValue(artistsFacade.error$);

  return {
    artists: data?.content ?? [],
    loading,
    error,
    page: params.page,
    totalPages: data?.totalPages ?? 0,
    search: params.search,
    tipo: params.tipo,
    dir: params.dir,
    setPage: (p: number) => artistsFacade.setPage(p),
    setSearch: (s: string) => artistsFacade.setQuery(s),
    setTipo: (t: string) => artistsFacade.setTipo(t),
    setDir: (d: "asc" | "desc") => artistsFacade.setSortDir(d),
    refresh: () => artistsFacade.refresh(),
  };
}
