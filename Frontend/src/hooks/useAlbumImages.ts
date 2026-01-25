import { useEffect, useMemo } from "react";
import { albumImagesFacade } from "../facades/AlbumImagesFacade";
import { useBehaviorSubjectValue } from "./useBehaviorSubjectValue";

export function useAlbumImages(albumId?: number) {
  const id = albumId ?? 0;
  const subject = useMemo(() => albumImagesFacade.state$(id), [id]);
  const state = useBehaviorSubjectValue(subject);

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
