import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { SidebarMenu } from "../components/SidebarMenu";
import { PageHeader } from "../components/PageHeader";
import { artistsService } from "../services/artistsService";
import { Spinner, Card } from "flowbite-react";
import { useToast } from "../contexts/ToastContext";
import { useAuthFacade } from "../hooks/useAuthFacade";

export default function ArtistDetailPage() {
  const { id } = useParams();
  const { user } = useAuthFacade();
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
        {/* Header Area */}
        <PageHeader title={`Bem-vindo, ${user}!`} />

        <div className="p-6 overflow-y-auto h-[calc(100vh-73px)]">
          {loading ? (
            <div className="flex justify-center p-10">
              <Spinner size="xl" aria-label="Carregando detalhes..." />
            </div>
          ) : !artist ? (
            <div className="text-gray-500 dark:text-gray-400">Artista não encontrado</div>
          ) : (
            <div>
              <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">{artist.nome}</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">Gênero: {artist.genero}</p>

              <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">Álbuns</h3>
              {(!artist.albuns || artist.albuns.length === 0) ? (
                <p className="text-gray-500 dark:text-gray-400">Nenhum álbum associado.</p>
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
