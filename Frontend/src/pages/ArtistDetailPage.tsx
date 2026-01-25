import { useEffect, useState, useMemo, useRef, useCallback } from "react";
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
import { getAlbumImages } from "../services/albunsService";
import axios from "axios";
import ManageAlbumImagesModal from "../components/ManageAlbumImagesModal";

type AlbumImageState =
  | { status: "loading"; urls: string[] }
  | { status: "ready"; urls: string[] }
  | { status: "empty"; urls: [] };

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
  const hasLoadedOnceRef = useRef(false);
  const [artist, setArtist] = useState<ArtistaDetalhado | null>(null);
  const [loading, setLoading] = useState(true);
  const [rateLimited, setRateLimited] = useState(false);
  const [showAddAlbumModal, setShowAddAlbumModal] = useState(false);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState("titulo");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [manageImagesAlbumId, setManageImagesAlbumId] = useState<number | null>(
    null,
  );
  const [albumImages, setAlbumImages] = useState<Record<number, AlbumImageState>>({});

  const fetchArtist = useCallback(async () => {
    if (!id) return;

    setRateLimited(false);
    setLoading(true);
    try {
      const data = await artistsService.getById(Number(id));
      setArtist(data);
      hasLoadedOnceRef.current = true;
    } catch (e) {
      console.error(e);
      const status = axios.isAxiosError(e) ? e.response?.status : undefined;
      const msg = getErrorMessage(e, "Erro ao carregar detalhes do artista");
      // 429 already triggers a global warning toast
      if (status !== 429) addToast(msg, "error");

      // If the initial load is rate limited, don't keep user on this page.
      if (status === 429 && !hasLoadedOnceRef.current) {
        setRateLimited(true);
      }
    } finally {
      setLoading(false);
    }
  }, [addToast, id]);

  useEffect(() => {
    fetchArtist();
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
    };
  }, [id, fetchArtist]);

  const debouncedSearch = useDebounce(search, 300);

  const visibleAlbuns = useMemo(() => {
    if (!artist?.albuns) return [];

    const normalizedQuery = debouncedSearch.trim().toLowerCase();
    const filtered = normalizedQuery
      ? artist.albuns.filter((a) =>
          (a?.titulo ?? "").toLowerCase().includes(normalizedQuery),
        )
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

      return String(aValue).localeCompare(String(bValue), "pt-BR", {
        sensitivity: "base",
      });
    });

    return sortDir === "asc" ? sorted : sorted.reverse();
  }, [artist?.albuns, debouncedSearch, sortField, sortDir]);

  // Load covers from MinIO for each album (first image is used as cover).
  useEffect(() => {
    let cancelled = false;
    const albums = artist?.albuns ?? [];
    const missing = albums.filter(
      (a) => a?.id != null && albumImages[a.id] === undefined,
    );
    if (missing.length === 0) return;

    setAlbumImages((prev) => {
      const next = { ...prev };
      for (const album of missing) {
        if (album.id != null) {
          next[album.id] = { status: "loading", urls: [] };
        }
      }
      return next;
    });

    (async () => {
      try {
        const results = await Promise.all(
          missing.map(async (album) => {
            const images = await getAlbumImages(album.id);
            return { albumId: album.id, urls: images.map((img) => img.url) };
          }),
        );

        if (cancelled) return;
        setAlbumImages((prev) => {
          const next = { ...prev };
          for (const { albumId, urls } of results) {
            next[albumId] =
              urls.length > 0
                ? { status: "ready", urls }
                : { status: "empty", urls: [] };
          }
          return next;
        });
      } catch (error) {
        if (!cancelled) {
          addToast(
            getErrorMessage(error, "Erro ao carregar capas do álbum"),
            "error",
          );
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [artist?.albuns, albumImages, addToast]);

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
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Álbuns
            </h3>
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
            {visibleAlbuns.map((alb) => {
              const imageState = albumImages[alb.id] ?? {
                status: "loading",
                urls: [],
              };
              const coverFromMinio =
                imageState.status === "ready" && imageState.urls.length > 0
                  ? imageState.urls[0]
                  : undefined;
              const cover =
                coverFromMinio ||
                (imageState.status === "empty" ? PLACEHOLDER_IMAGE : undefined) ||
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
                            <span className="mr-2">Nome:</span>
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
              fetchArtist();
            }}
          />
        </div>
      )}
    </PageLayout>
  );
}
