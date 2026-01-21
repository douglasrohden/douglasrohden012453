import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { PageLayout } from "../components/layout/PageLayout";
import { artistsService } from "../services/artistsService";
import { Card } from "flowbite-react";
import { useToast } from "../contexts/ToastContext";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { EmptyState } from "../components/common/EmptyState";
import { CardGrid } from "../components/common/CardGrid";

export default function ArtistDetailPage() {
  const { id } = useParams();
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
    <PageLayout>
      {loading ? (
        <LoadingSpinner message="Carregando detalhes..." />
      ) : !artist ? (
        <EmptyState message="Artista não encontrado" />
      ) : (
        <div>
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">{artist.nome}</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Gênero: {artist.genero}</p>

          <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">Álbuns</h3>

          <CardGrid
            isEmpty={!artist.albuns || artist.albuns.length === 0}
            emptyMessage="Nenhum álbum associado."
          >
            {artist.albuns?.map((alb: any) => (
              <Card
                key={alb.id}
                className="h-full"
                imgAlt={alb.titulo}
                imgSrc={alb.imageUrl || "https://flowbite.com/docs/images/blog/image-1.jpg"}
              >
                <h5 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white line-clamp-1" title={alb.titulo}>
                  {alb.titulo}
                </h5>
                <div className="h-6">
                  {alb.ano && (
                    <p className="font-normal text-gray-700 dark:text-gray-400">
                      {alb.ano}
                    </p>
                  )}
                </div>
              </Card>
            ))}
          </CardGrid>
        </div>
      )}
    </PageLayout>
  );
}
