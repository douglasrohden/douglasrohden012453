import { useEffect } from 'react';
import { useObservable } from './useObservable';
import { albunsFacade } from '../facades/albuns.facade';

export function useAlbuns() {
  const state = useObservable(albunsFacade.state$, albunsFacade.snapshot);

  useEffect(() => {
    // Fetch on mount if we don't have data yet (or if content is empty)
    if (!state.data?.content || state.data.content.length === 0) {
      albunsFacade.fetch();
    }
  }, []);

  const setPage = (page: number) => {
    albunsFacade.fetch(page);
  };

  return {
    albuns: state.data?.content ?? [],
    page: state.data?.number ?? 0,
    totalPages: state.data?.totalPages ?? 0,
    totalElements: state.data?.totalElements ?? 0,
    first: state.data?.first ?? true,
    last: state.data?.last ?? true,
    loading: state.loading,
    error: state.error,
    setPage
  };
}
