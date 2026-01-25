import { PageLayout } from "../components/layout/PageLayout";
import AlbunsList from "../components/AlbunsList";
import { useAlbumCreatedWebSocket } from "../hooks/useAlbumCreatedWebSocket";
import { albunsFacade } from "../facades/albuns.facade";
import { useCallback, useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function AlbunsPage() {
  const location = useLocation();

  const onAlbumCreated = useCallback(() => {
    // Keep it simple: refresh list when any new album is created
    albunsFacade.fetch();
  }, []);

  useAlbumCreatedWebSocket(onAlbumCreated);

  useEffect(() => {
    albunsFacade.fetch();
  }, [location.key]);

  return (
    <PageLayout>
      <AlbunsList />
    </PageLayout>
  );
}
