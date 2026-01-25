import { Pagination, Card, Alert } from "flowbite-react";
import { useAlbuns } from "../hooks/useAlbuns";
import { useMemo, useState } from "react";
import { HiSearch, HiClock, HiPencil } from "react-icons/hi";
import { CardGrid } from "./common/CardGrid";
import { ListToolbar } from "./common/ListToolbar";
import CreateAlbumForm from "./CreateAlbumForm";
import ManageAlbumImagesModal from "./ManageAlbumImagesModal";
import { useDebounce } from "../hooks/useDebounce";
import type { Album } from "../services/albunsService";
import EditAlbumModal from "./EditAlbumModal";
import { albunsFacade } from "../facades/albuns.facade";

export default function AlbunsList() {
  const { albuns, loading, error, page, totalPages, setPage } = useAlbuns();

  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState("titulo");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState<Album | null>(null);
  const [manageImagesAlbumId, setManageImagesAlbumId] = useState<number | null>(
    null,
  );
  const debouncedSearch = useDebounce(search, 300);

  const visibleAlbuns = useMemo(() => {
    const normalizedQuery = debouncedSearch.trim().toLowerCase();
    const filtered = normalizedQuery
      ? albuns.filter((a) =>
          (a?.titulo ?? "").toLowerCase().includes(normalizedQuery),
        )
      : albuns;

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
  }, [albuns, debouncedSearch, sortField, sortDir]);

  if (error) {
    const lower = String(error).toLowerCase();
    const isRateLimit =
      lower.includes("muitas requisi") ||
      (lower.includes("rate") && lower.includes("limit")) ||
      lower.includes("429");

    return (
      <Alert
        color={isRateLimit ? "warning" : "failure"}
        icon={isRateLimit ? HiClock : undefined}
      >
        {String(error)}
      </Alert>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
          Álbuns
        </h2>
      </div>

      <ListToolbar
        query={search}
        onQueryChange={setSearch}
        queryPlaceholder="Buscar álbum..."
        queryId="search-albuns"
        searchIcon={HiSearch}
        sortField={sortField}
        onSortFieldChange={setSortField}
        sortFieldId="sort-albuns"
        sortFieldLabel="Ordenar por"
        sortFieldOptions={[
          { value: "titulo", label: "Título" },
          { value: "ano", label: "Ano" },
        ]}
        sortDir={sortDir}
        onSortDirChange={setSortDir}
        sortDirId="sort-dir-albuns"
        sortDirLabel="Ordem"
        addLabel="Adicionar"
        onAdd={() => setShowCreateModal(true)}
      />

      <CardGrid
        loading={loading}
        isEmpty={visibleAlbuns.length === 0}
        emptyMessage="Nenhum álbum encontrado."
      >
        {visibleAlbuns.map((album) => (
          <AlbumCard
            key={album.id}
            album={album}
            onEdit={() => setEditingAlbum(album)}
            onManageImages={() => setManageImagesAlbumId(album.id)}
          />
        ))}
      </CardGrid>

      {totalPages > 1 && (
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

      <CreateAlbumForm
        show={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => setPage(page)}
      />

      <EditAlbumModal
        show={!!editingAlbum}
        album={editingAlbum}
        onClose={() => setEditingAlbum(null)}
        onSuccess={(updated) => {
          albunsFacade.updateAlbumInState(updated);
          setPage(page);
        }}
      />

      <ManageAlbumImagesModal
        show={!!manageImagesAlbumId}
        albumId={manageImagesAlbumId}
        onClose={() => {
          setManageImagesAlbumId(null);
          setPage(page);
        }}
      />
    </div>
  );
}

function AlbumCard({
  album,
  onEdit,
  onManageImages,
}: {
  album: Album;
  onEdit: () => void;
  onManageImages: () => void;
}) {
  const src = album?.capaUrl || undefined;

  return (
    <Card
      className="flex h-full flex-col transition-shadow hover:shadow-lg"
      renderImage={() => (
        <div className="group relative">
          {album.artistaNome && (
            <div className="absolute top-0 left-0 z-10 rounded-br bg-black/50 px-2 py-1 text-xs text-white">
              {album.artistaNome}
            </div>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="absolute top-1 right-1 z-10 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80 focus:outline-none focus:ring-2 focus:ring-white"
            title="Editar informações"
            aria-label="Editar informações"
          >
            <HiPencil className="h-4 w-4" />
          </button>
          <img
            src={src || "https://flowbite.com/docs/images/blog/image-1.jpg"}
            alt={album.titulo}
            className="h-48 w-full object-cover"
          />
        </div>
      )}
    >
      <div className="flex h-full flex-col justify-between">
        <div>
          <h5
            className="line-clamp-1 truncate text-xl font-bold tracking-tight text-gray-900 dark:text-white"
            title={album.titulo}
          >
            <span className="mr-2 text-sm font-semibold text-gray-600 dark:text-gray-400">
              Título:
            </span>
            <span>{album.titulo ?? "—"}</span>
          </h5>
          <div className="mb-4">
            <p className="font-normal text-gray-700 dark:text-gray-400">
              <span className="mr-2 text-sm font-semibold text-gray-600 dark:text-gray-400">
                Cantor/Banda:
              </span>
              <span>{album.artistaNome ?? "—"}</span>
            </p>

            <p className="font-normal text-gray-700 dark:text-gray-400">
              <span className="mr-2 text-sm font-semibold text-gray-600 dark:text-gray-400">
                Ano:
              </span>
              <span>{album.ano ?? "—"}</span>
            </p>

            {album.individual !== undefined && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <span className="mr-2 text-sm font-semibold text-gray-600 dark:text-gray-400">
                  Tipo:
                </span>
                <span>{album.individual ? "Cantor(a)" : "Banda"}</span>
              </p>
            )}
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onManageImages();
          }}
          className="mt-2 w-full rounded-lg bg-blue-700 px-3 py-2 text-center text-sm font-medium text-white hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 focus:outline-none dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
        >
          Gerenciar Capas
        </button>
      </div>
    </Card>
  );
}
