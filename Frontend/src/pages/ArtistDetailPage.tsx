import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { Card } from "flowbite-react";
import { PageLayout } from "../components/layout/PageLayout";
import { useToast } from "../contexts/ToastContext";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { EmptyState } from "../components/common/EmptyState";
import { CardGrid } from "../components/common/CardGrid";
import CreateAlbumForm from "../components/CreateAlbumForm";
import { ListToolbar } from "../components/common/ListToolbar";
import ManageAlbumImagesModal from "../components/ManageAlbumImagesModal";
import EditAlbumModal from "../components/EditAlbumModal";
import { artistDetailFacade } from "../facades/ArtistDetailFacade";
import { useBehaviorSubjectValue } from "../hooks/useBehaviorSubjectValue";

const PLACEHOLDER_IMAGE = "https://flowbite.com/docs/images/blog/image-1.jpg";

interface Album {
  id: number;
  titulo: string;
  ano?: number;
  capaUrl?: string | null;
}

interface ArtistaDetalhado {
  id: number;
  nome: string;
  tipo?: string;
  albuns?: Album[];
}

export default function ArtistDetailPage() {
  const { id } = useParams();
  const { addToast } = useToast();
  const retryTimeoutRef = useRef<number | null>(null);
  const [hasWarnedRateLimit, setHasWarnedRateLimit] = useState(false);
  const data = useBehaviorSubjectValue(artistDetailFacade.data$);
  const loading = useBehaviorSubjectValue(artistDetailFacade.loading$);
  const error = useBehaviorSubjectValue(artistDetailFacade.error$);
  const status = useBehaviorSubjectValue(artistDetailFacade.status$);
  const params = useBehaviorSubjectValue(artistDetailFacade.params$);
  const search = params.search;
  const sortField = params.sortField;
  const sortDir = params.sortDir;

  const [showAddAlbumModal, setShowAddAlbumModal] = useState(false);
  const [manageImagesAlbumId, setManageImagesAlbumId] = useState<number | null>(
    null,
  );
  const [editingAlbum, setEditingAlbum] = useState<Album | null>(null);

  useEffect(() => {
    artistDetailFacade.activate();
    return () => artistDetailFacade.deactivate();
  }, []);

  useEffect(() => {
    if (!id) return;
    artistDetailFacade.setArtistId(Number(id));
    artistDetailFacade.refresh();
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
    };
  }, [id]);

  useEffect(() => {
    if (status === 429 && !hasWarnedRateLimit) {
      addToast("Muitas requisições. Tente novamente em instantes.", "warning");
      setHasWarnedRateLimit(true);
    }
    if (status !== 429 && hasWarnedRateLimit) {
      setHasWarnedRateLimit(false);
    }
  }, [status, addToast, hasWarnedRateLimit]);

  const visibleAlbuns = data.visibleAlbums ?? [];
  const artist = data.artist as ArtistaDetalhado | null;
  const rateLimited = status === 429;

  const handleSortFieldChange = (next: string) => {
    if (next === "titulo" || next === "ano") {
      artistDetailFacade.setSortField(next);
    }
  };

  const handleSortDirChange = (next: "asc" | "desc") => {
    artistDetailFacade.setSortDir(next);
  };

  const handleSearchChange = (value: string) => {
    artistDetailFacade.setSearch(value);
  };

  return (
    <PageLayout>
      {loading ? (
        <LoadingSpinner message="Carregando detalhes..." />
      ) : rateLimited ? (
        <EmptyState message="Muitas requisições. Aguarde e tente novamente." />
      ) : error ? (
        <EmptyState message={error} />
      ) : !artist ? (
        <EmptyState message="Artista não encontrado" />
      ) : (
        <div>
          <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                {artist.nome}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <span className="mr-2 font-semibold">Cantor/Banda:</span>
                <span>
                  {artist.tipo
                    ? artist.tipo === "BANDA"
                      ? "Banda"
                      : "Cantor(a)"
                    : "—"}
                </span>
              </p>
            </div>

          </div>

          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Álbuns
            </h3>
          </div>

          <ListToolbar
            query={search}
            onQueryChange={handleSearchChange}
            queryPlaceholder="Buscar álbum..."
            queryId="search-albuns-artista"
            sortField={sortField}
            onSortFieldChange={handleSortFieldChange}
            sortFieldId="sort-albuns-artista"
            sortFieldLabel="Ordenar por"
            sortFieldOptions={[
              { value: "titulo", label: "Título" },
              { value: "ano", label: "Ano" },
            ]}
            sortDir={sortDir}
            onSortDirChange={handleSortDirChange}
            sortDirId="sort-dir-albuns-artista"
            sortDirLabel="Ordem"
            addLabel="Adicionar Álbum"
            onAdd={() => setShowAddAlbumModal(true)}
          />

          <CreateAlbumForm
            artistId={artist.id}
            show={showAddAlbumModal}
            onClose={() => setShowAddAlbumModal(false)}
            onSuccess={() => artistDetailFacade.refresh()}
          />

          <CardGrid
            isEmpty={visibleAlbuns.length === 0}
            emptyMessage="Nenhum álbum encontrado."
          >
            {visibleAlbuns.map((alb) => {
              const cover =
                alb.capaUrl ||
                PLACEHOLDER_IMAGE;

              return (
                <Card
                  key={alb.id}
                  className="flex h-full flex-col transition-shadow hover:shadow-lg"
                  renderImage={() => (
                    <div>
                      {artist.nome && (
                        <div className="px-4 pt-4 pb-2">
                          <p className="text-sm font-semibold tracking-wide text-gray-600 uppercase dark:text-gray-400">
                            <span className="mr-2">Artista:</span>
                            <span className="normal-case">{artist.nome}</span>
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            <span className="mr-2 font-semibold">
                              Cantor/Banda:
                            </span>
                            <span>
                              {artist.tipo
                                ? artist.tipo === "BANDA"
                                  ? "Banda"
                                  : "Cantor(a)"
                                : "—"}
                            </span>
                          </p>
                        </div>
                      )}
                      <img
                        src={cover}
                        alt={alb.titulo}
                        className="h-auto w-full object-cover"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE;
                        }}
                      />
                    </div>
                  )}
                >
                  <div className="flex h-full flex-col">
                    <div className="flex-1">
                      <h5
                        className="line-clamp-1 text-xl font-bold tracking-tight text-gray-900 dark:text-white"
                        title={alb.titulo}
                      >
                        <span className="mr-2 text-sm font-semibold text-gray-600 dark:text-gray-400">
                          Título:
                        </span>
                        <span>{alb.titulo ?? "—"}</span>
                      </h5>
                      <div className="mb-2">
                        <p className="font-normal text-gray-700 dark:text-gray-400">
                          <span className="mr-2 text-sm font-semibold text-gray-600 dark:text-gray-400">
                            Ano:
                          </span>
                          <span>{alb.ano ?? "—"}</span>
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => setManageImagesAlbumId(alb.id)}
                      className="mt-4 w-full rounded-lg bg-blue-700 px-3 py-2 text-center text-sm font-medium text-white hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 focus:outline-none dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                    >
                      Gerenciar Capas
                    </button>
                    <button
                      onClick={() => setEditingAlbum(alb)}
                      className="mt-2 w-full rounded-lg bg-gray-200 px-3 py-2 text-center text-sm font-medium text-gray-800 hover:bg-gray-300 focus:ring-4 focus:ring-gray-100 focus:outline-none dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 dark:focus:ring-gray-600"
                    >
                      Editar
                    </button>
                  </div>
                </Card>
              );
            })}
          </CardGrid>

          <ManageAlbumImagesModal
            show={!!manageImagesAlbumId}
            albumId={manageImagesAlbumId}
            onClose={() => {
              setManageImagesAlbumId(null);
            }}
          />

          <EditAlbumModal
            show={!!editingAlbum}
            album={editingAlbum}
            onClose={() => setEditingAlbum(null)}
            onSuccess={() => {
              artistDetailFacade.refresh();
            }}
          />
        </div>
      )}
    </PageLayout>
  );
}
