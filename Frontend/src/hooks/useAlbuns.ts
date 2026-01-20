import { useEffect } from 'react';
import { useObservable } from './useObservable';
import { albunsFacade } from '../facades/albuns.facade';

export function useAlbuns() {
  const state = useObservable(albunsFacade.state$, {
    data: [] as any[],
    loading: false,
    error: null as string | null,
  });

  useEffect(() => {
    // Fetch on mount if we don't have data yet
    if (!state.data || state.data.length === 0) {
      albunsFacade.fetch();
    }
    // no cleanup needed here; facade is singleton
  }, []);

  return { albuns: state.data ?? [], loading: state.loading, error: state.error };
}
