import { Pagination, Select, Card, Label, Button } from "flowbite-react";
import { PageLayout } from "../components/layout/PageLayout";
import CreateArtistForm from "../components/CreateArtistForm";
import EditArtistForm from "../components/EditArtistForm";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CardGrid } from "../components/common/CardGrid";
import { ListToolbar } from "../components/common/ListToolbar";
import { useArtists } from "../hooks/useArtists";
import { HiPencil, HiTrash } from "react-icons/hi";
import { artistsFacade } from "../facades/ArtistsFacade";
import { useToast } from "../contexts/ToastContext";
import { getErrorMessage } from "../lib/http";

export default function HomePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showCreate, setShowCreate] = useState(false);
  const [editingArtist, setEditingArtist] = useState<{
    id: number;
    nome: string;
    tipo?: string;
  } | null>(null);
  const [navLock, setNavLock] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const { addToast } = useToast();

  // Release navigation lock when route changes.
  useEffect(() => {
    setNavLock(false);
  }, [location.pathname]);

  const {
    artists,
    loading,
    page,
    totalPages,
    search,
    tipo,
    dir,
    setPage,
    setSearch,
    setTipo,
    setDir,
    refresh,
  } = useArtists();

  const handleDelete = async (artistId: number, artistName: string) => {
    const confirmed = window.confirm(`Excluir "${artistName}"? Esta ação não pode ser desfeita.`);
    if (!confirmed) return;

    setDeletingId(artistId);
    try {
      await artistsFacade.delete(artistId);
      addToast("Artista excluído com sucesso", "success");
    } catch (err) {
      const msg = getErrorMessage(err, "Erro ao excluir artista");
      addToast(msg, "error");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <PageLayout>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
          Artistas
        </h2>
      </div>

      <ListToolbar
        query={search}
        onQueryChange={setSearch}
        queryPlaceholder="Buscar artista..."
        queryId="search"
        sortDir={dir}
        onSortDirChange={setDir}
        sortDirId="sort-artistas"
        sortDirLabel="Ordem"
        addLabel="Adicionar"
        onAdd={() => {
          if (navLock) return;
          setShowCreate(true);
        }}
        extra={
          <div className="w-full md:w-56">
            <Label
              htmlFor="tipo"
              className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300"
            >
              Tipo
            </Label>
            <Select
              id="tipo"
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
            >
              <option value="TODOS">Todos os tipos</option>
              <option value="CANTOR">Cantor</option>
              <option value="BANDA">Banda</option>
            </Select>
          </div>
        }
      />

      <CreateArtistForm
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={refresh}
      />

      <EditArtistForm
        isOpen={!!editingArtist}
        artist={editingArtist}
        onClose={() => setEditingArtist(null)}
        onUpdated={async () => {
          // Small delay to ensure backend commit
          await new Promise((resolve) => setTimeout(resolve, 200));
          refresh();
        }}
      />

      <CardGrid
        loading={loading}
        isEmpty={artists.length === 0}
        emptyMessage="Nenhum artista encontrado."
      >
        {artists.map((artist) => (
          <Card
            key={artist.id}
            className="h-full cursor-pointer transition-shadow hover:shadow-lg"
            renderImage={() => (
              <div className="group relative">
                <div className="absolute top-1 right-1 z-10 flex gap-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingArtist(artist);
                    }}
                    className="rounded-full bg-black/60 p-1.5 text-white shadow-sm hover:bg-black/80 focus:outline-none focus:ring-2 focus:ring-white"
                    title="Editar artista"
                    aria-label="Editar artista"
                  >
                    <HiPencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(artist.id, artist.nome);
                    }}
                    className="rounded-full bg-red-600 p-1.5 text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-white disabled:cursor-not-allowed disabled:bg-red-400"
                    disabled={deletingId === artist.id}
                    title="Excluir artista"
                    aria-label="Excluir artista"
                  >
                    {deletingId === artist.id ? (
                      <span className="block h-4 w-4 animate-pulse">•</span>
                    ) : (
                      <HiTrash className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <img
                  src={
                    artist.imageUrl ||
                    "https://flowbite.com/docs/images/blog/image-1.jpg"
                  }
                  alt={artist.nome}
                  className="h-48 w-full object-cover"
                />
              </div>
            )}
            onClick={() => {
              if (navLock) return;
              setNavLock(true);
              navigate(`/artista/${artist.id}`);
            }}
          >
            <span
              className="line-clamp-3 text-2xl font-bold tracking-tight text-gray-900 dark:text-white"
              title={artist.nome}
            > 
              <span className="normal-case">{artist.nome ?? "—"}</span>
            </span>
            <p className="line-clamp-1 h-6 font-normal text-gray-700 dark:text-gray-400">
         
              <span>
                {artist.tipo
                  ? artist.tipo === "BANDA"
                    ? "Banda"
                    : "Cantor(a)"
                  : "—"}
              </span>
            </p>

            {typeof artist.albumCount === "number" && (
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                <span className="mr-2 text-sm font-semibold text-gray-600 dark:text-gray-400">
                  Álbuns:
                </span>
                {artist.albumCount}{" "}
                {artist.albumCount === 1 ? "álbum" : "álbuns"}
              </p>
            )}

            <Button
              className="mt-4 w-full bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-700"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/artista/${artist.id}`);
              }}
            >
              Álbuns
            </Button>
          </Card>
        ))}
      </CardGrid>

      {totalPages >= 1 && (
        <div className="mt-8 flex justify-center">
          <Pagination
            currentPage={page + 1}
            totalPages={totalPages}
            onPageChange={(p) => setPage(p - 1)}
            showIcons
            previousLabel="Anterior"
            nextLabel="Próxima"
          />
        </div>
      )}
    </PageLayout>
  );
}
