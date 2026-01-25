import { useEffect, useMemo } from "react";
import { albumImagesFacade } from "../facades/albumImages.facade";
import { useObservable } from "./useObservable";

export function useAlbumImages(albumId?: number) {
  const id = albumId ?? 0;
  const observable = useMemo(() => albumImagesFacade.state$(id), [id]);
  const state = useObservable(observable, albumImagesFacade.snapshot(id));

  useEffect(() => {
    if (!albumId) return;
    const current = albumImagesFacade.snapshot(id);
    if (current.status === "ready" || current.status === "loading") return;
    void albumImagesFacade.load(id);
  }, [albumId, id]);

  const reload = () => {
    if (!albumId) return Promise.resolve();
    return albumImagesFacade.load(id);
  };

  return { state, reload };
}
