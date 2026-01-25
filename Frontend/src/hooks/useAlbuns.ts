import { useEffect } from "react";
import { albunsFacade } from "../facades/AlbumsFacade";
import { useBehaviorSubjectValue } from "./useBehaviorSubjectValue";

export function useAlbuns() {
  const data = useBehaviorSubjectValue(albunsFacade.data$);
  const loading = useBehaviorSubjectValue(albunsFacade.loading$);
  const error = useBehaviorSubjectValue(albunsFacade.error$);

  useEffect(() => {
    // Fetch on mount if we don't have data yet (or if content is empty)
    if (
      !loading &&
      (!data?.content || data.content.length === 0)
    ) {
      albunsFacade.load();
    }
  }, [data?.content, loading]);

  const setPage = (page: number) => {
    albunsFacade.setPage(page);
  };

  return {
    albuns: data?.content ?? [],
    page: data?.number ?? 0,
    totalPages: data?.totalPages ?? 0,
    totalElements: data?.totalElements ?? 0,
    first: data?.first ?? true,
    last: data?.last ?? true,
    loading,
    error,
    setPage,
  };
}
