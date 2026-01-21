import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { SidebarMenu } from "../components/SidebarMenu";
import { useAuthFacade } from "../hooks/useAuthFacade";
import { artistsService } from "../services/artistsService";
import { AlbumCard } from "../components/AlbumCard";

export default function ArtistDetailPage() {
  const { id } = useParams();
  const { user, logout } = useAuthFacade();
  const [artist, setArtist] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      try {
        const data = await artistsService.getById(Number(id));
        setArtist(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  return (
    <main className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <SidebarMenu />

      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b bg-white dark:bg-gray-800">
          <h1 className="text-xl font-bold">Detalhe do artista</h1>
          <div className="flex gap-2">
            <div className="text-sm text-gray-500 dark:text-gray-400">{user}</div>
            <button className="px-3 py-1 bg-gray-200 rounded" onClick={logout}>Sair</button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto h-[calc(100vh-73px)]">
          {loading ? (
            <div>Carregando...</div>
          ) : !artist ? (
            <div>Artista não encontrado</div>
          ) : (
            <div>
              <h2 className="text-2xl font-bold mb-4">{artist.nome}</h2>
              <p className="text-gray-600 mb-6">Gênero: {artist.genero}</p>

              <h3 className="text-xl font-semibold mb-3">Álbuns</h3>
              {(!artist.albuns || artist.albuns.length === 0) ? (
                <p className="text-gray-500">Nenhum álbum associado.</p>
              ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {artist.albuns.map((alb: any) => (
                    <AlbumCard key={alb.id} title={alb.titulo} year={alb.ano} coverUrl={alb.imageUrl} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
