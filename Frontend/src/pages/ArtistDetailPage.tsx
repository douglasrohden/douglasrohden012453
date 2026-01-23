import { useEffect, useState, useMemo, useRef } from "react";
import { useDebounce } from "../hooks/useDebounce";
import { useParams } from "react-router-dom";
import { PageLayout } from "../components/layout/PageLayout";
import { artistsService } from "../services/artistsService";
import { Card } from "flowbite-react";
import { useToast } from "../contexts/ToastContext";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { EmptyState } from "../components/common/EmptyState";
import { CardGrid } from "../components/common/CardGrid";
import CreateAlbumForm from "../components/CreateAlbumForm";
import { ListToolbar } from "../components/common/ListToolbar";
import { getErrorMessage } from "../api/client";
import axios from "axios";

interface Album {
  id: number;
  titulo: string;
  ano?: number;
  imageUrl?: string;
}

interface ArtistaDetalhado {
  id: number;
  nome: string;
  genero: string;
  imageUrl?: string;
  albuns?: Album[];
}

export default function ArtistDetailPage() {
  const { id } = useParams();
  const { addToast } = useToast();
  const retryTimeoutRef = useRef<number | null>(null);
  const [artist, setArtist] = useState<ArtistaDetalhado | null>(null);
  const [loading, setLoading] = useState(true);
  const [rateLimited, setRateLimited] = useState(false);
  const [showAddAlbumModal, setShowAddAlbumModal] = useState(false);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState("titulo");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const fetchArtist = async () => {
    if (!id) return;

    setRateLimited(false);
    setLoading(true);
    try {
      const data = await artistsService.getById(Number(id));
      setArtist(data);
    } catch (e) {
      console.error(e);
      const status = axios.isAxiosError(e) ? e.response?.status : undefined;
      const msg = getErrorMessage(e, "Erro ao carregar detalhes do artista");
      // 429 already triggers a global warning toast
      if (status !== 429) addToast(msg, "error");

      // If the initial load is rate limited, don't keep user on this page.
      if (status === 429 && !artist) {
        setRateLimited(true);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArtist();
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
    };
  }, [id]);

  const debouncedSearch = useDebounce(search, 300);

  const visibleAlbuns = useMemo(() => {
    if (!artist?.albuns) return [];

    const normalizedQuery = debouncedSearch.trim().toLowerCase();
    const filtered = normalizedQuery
      ? artist.albuns.filter((a) => (a?.titulo ?? "").toLowerCase().includes(normalizedQuery))
      : artist.albuns;

    const sorted = [...filtered].sort((a, b) => {
      const aValue = a?.[sortField as keyof Album];
      const bValue = b?.[sortField as keyof Album];

      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return 1;
      if (bValue == null) return -1;

      if (typeof aValue === "number" && typeof bValue === "number") {
        return aValue - bValue;
      }

      return String(aValue).localeCompare(String(bValue), "pt-BR", { sensitivity: "base" });
    });

    return sortDir === "asc" ? sorted : sorted.reverse();
  }, [artist?.albuns, debouncedSearch, sortField, sortDir]);

  return (
    <PageLayout>
      {loading ? (
        <LoadingSpinner message="Carregando detalhes..." />
      ) : rateLimited ? (
        <EmptyState message="Muitas requisições. Aguarde e tente novamente." />
      ) : !artist ? (
        <EmptyState message="Artista não encontrado" />
      ) : (
        <div>
          
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Álbuns</h3>
          </div>

          <ListToolbar
            query={search}
            onQueryChange={setSearch}
            queryPlaceholder="Buscar álbum..."
            queryId="search-albuns-artista"
            sortField={sortField}
            onSortFieldChange={setSortField}
            sortFieldId="sort-albuns-artista"
            sortFieldLabel="Ordenar por"
            sortFieldOptions={[
              { value: "titulo", label: "Título" },
              { value: "ano", label: "Ano" },
            ]}
            sortDir={sortDir}
            onSortDirChange={setSortDir}
            sortDirId="sort-dir-albuns-artista"
            sortDirLabel="Ordem"
            addLabel="Adicionar Álbum"
            onAdd={() => setShowAddAlbumModal(true)}
          />

          <CreateAlbumForm
            artistId={artist.id}
            show={showAddAlbumModal}
            onClose={() => setShowAddAlbumModal(false)}
            onSuccess={fetchArtist}
          />

          <CardGrid
            isEmpty={visibleAlbuns.length === 0}
            emptyMessage="Nenhum álbum encontrado."
          >
            {visibleAlbuns.map((alb) => (
              <Card
                key={alb.id}
                className="h-full transition-shadow hover:shadow-lg"
                renderImage={() => (
                  <div>
                    {artist.nome && (
                      <div className="px-4 pt-4 pb-2">
                        <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                          {artist.nome}
                        </p>
                      </div>
                    )}
                    <img
                      src={alb.imageUrl || "https://flowbite.com/docs/images/blog/image-1.jpg"}
                      alt={alb.titulo}
                      className="h-auto w-full object-cover"
                    />
                  </div>
                )}
              >
                <h5 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white line-clamp-1" title={alb.titulo}>
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
