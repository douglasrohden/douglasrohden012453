import { useCallback } from "react";
import { SidebarMenu } from "../components/SidebarMenu";
import { PageHeader } from "../components/PageHeader";
import AlbunsList from "../components/AlbunsList";
import { useAlbumCreatedWebSocket } from "../hooks/useAlbumCreatedWebSocket";
import { albunsFacade } from "../facades/albuns.facade";
import { useAuthFacade } from "../hooks/useAuthFacade";

export default function AlbunsPage() {
    const { user } = useAuthFacade();
    const onAlbumCreated = useCallback(() => {
        // Keep it simple: refresh list when any new album is created
        albunsFacade.fetch();
    }, []);

    useAlbumCreatedWebSocket(onAlbumCreated);

    return (
        <main className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
            <SidebarMenu />

            <div className="flex-1 flex flex-col">
                {/* Header Area */}
                <PageHeader title={`Bem-vindo, ${user}!`} />

                {/* Content Area */}
                <div className="p-6 overflow-y-auto h-[calc(100vh-73px)]">
                    <AlbunsList />
                </div>
            </div>
        </main>
    );
}
