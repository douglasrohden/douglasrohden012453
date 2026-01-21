import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { SidebarMenu } from "../components/SidebarMenu";
import { useAuthFacade } from "../hooks/useAuthFacade";
import { artistsService } from "../services/artistsService";
import { Spinner, Card } from "flowbite-react";
import { useToast } from "../contexts/ToastContext";

export default function ArtistDetailPage() {
  const { id } = useParams();
  const { user, logout } = useAuthFacade();
  const { addToast } = useToast();
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
        addToast("Erro ao carregar detalhes do artista", "error");
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
            <div className="flex justify-center p-10">
              <Spinner size="xl" aria-label="Carregando detalhes..." />
            </div>
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
                    <Card
                      key={alb.id}
                      className="max-w-sm"
                      imgAlt={alb.titulo}
                      imgSrc={alb.imageUrl || "https://flowbite.com/docs/images/blog/image-1.jpg"}
                    >
                      <h5 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                        {alb.titulo}
                      </h5>
                      {alb.ano && (
                        <p className="font-normal text-gray-700 dark:text-gray-400">
                          {alb.ano}
                        </p>
                      )}
                    </Card>
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
