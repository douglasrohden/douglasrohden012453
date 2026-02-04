import { useEffect } from "react";
import { albumsFacade } from "../facades/AlbumsFacade";
import { useBehaviorSubjectValue } from "./useBehaviorSubjectValue";

export function useAlbuns() {
  const data = useBehaviorSubjectValue(albumsFacade.data$);
  const params = useBehaviorSubjectValue(albumsFacade.params$);
  const loading = useBehaviorSubjectValue(albumsFacade.loading$);
  const error = useBehaviorSubjectValue(albumsFacade.error$);

  useEffect(() => {
    albumsFacade.activate();
    return () => albumsFacade.deactivate();
  }, []);

  return {
    data,
    params,
    loading,
    error,
    setPage: (page: number) => albumsFacade.setPage(page),
    setQuery: (query: string) => albumsFacade.setQuery(query),
    setSortField: (field: "titulo" | "ano") => albumsFacade.setSortField(field),
    setSortDir: (dir: "asc" | "desc") => albumsFacade.setSortDir(dir),
    refresh: () => albumsFacade.refresh(),
  };
}
