import { PageLayout } from "../components/layout/PageLayout";
import AlbunsList from "../components/AlbunsList";
import { useAlbumCreatedWebSocket } from "../hooks/useAlbumCreatedWebSocket";
import { albunsFacade } from "../facades/albuns.facade";
import { useCallback } from "react";

export default function AlbunsPage() {
    const onAlbumCreated = useCallback(() => {
        // Keep it simple: refresh list when any new album is created
        albunsFacade.fetch();
    }, []);

    useAlbumCreatedWebSocket(onAlbumCreated);

    return (
        <PageLayout>
            <AlbunsList />
        </PageLayout>
    );
}
