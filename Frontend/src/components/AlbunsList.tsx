
import { Pagination, Card, Alert } from 'flowbite-react';
import { useAlbuns } from '../hooks/useAlbuns';
import { useMemo, useState } from 'react';
import { HiSearch, HiClock } from 'react-icons/hi';
import { CardGrid } from './common/CardGrid';
import { ListToolbar } from './common/ListToolbar';
import CreateAlbumForm from './CreateAlbumForm';
import ManageAlbumImagesModal from './ManageAlbumImagesModal';
import { useDebounce } from '../hooks/useDebounce';
import type { Album } from '../services/albunsService';

export default function AlbunsList() {
  const { albuns, loading, error, page, totalPages, setPage } = useAlbuns();

  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState("titulo");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [manageImagesAlbumId, setManageImagesAlbumId] = useState<number | null>(null);
  const debouncedSearch = useDebounce(search, 300);

  const visibleAlbuns = useMemo(() => {
    const normalizedQuery = debouncedSearch.trim().toLowerCase();
    const filtered = normalizedQuery
      ? albuns.filter((a) => (a?.titulo ?? "").toLowerCase().includes(normalizedQuery))
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

      return String(aValue).localeCompare(String(bValue), "pt-BR", { sensitivity: "base" });
    });

    return sortDir === "asc" ? sorted : sorted.reverse();
  }, [albuns, debouncedSearch, sortField, sortDir]);

  if (error) {
    const lower = String(error).toLowerCase();
    const isRateLimit = lower.includes("muitas requisi") || lower.includes("rate") && lower.includes("limit") || lower.includes("429");

    return (
      <Alert color={isRateLimit ? "warning" : "failure"} icon={isRateLimit ? HiClock : undefined}>
        {String(error)}
      </Alert>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Álbuns</h2>
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
            onManageImages={() => setManageImagesAlbumId(album.id)}
          />
        ))}
      </CardGrid>

      {totalPages > 1 && (
        <div className="flex justify-center mt-8">
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

      <ManageAlbumImagesModal
        show={!!manageImagesAlbumId}
        albumId={manageImagesAlbumId}
        onClose={() => setManageImagesAlbumId(null)}
      />
    </div>
  );
}

function AlbumCard({ album, onManageImages }: { album: Album; onManageImages: () => void }) {
  const src = album?.capaUrl || undefined;

  return (
    <Card
      className="h-full transition-shadow hover:shadow-lg flex flex-col"
      renderImage={() => (
        <div className="relative group">
          {album.artistaNome && (
            <div className="absolute top-0 left-0 bg-black/50 text-white text-xs px-2 py-1 rounded-br z-10">
              {album.artistaNome}
            </div>
          )}
          <img
            src={src || "https://flowbite.com/docs/images/blog/image-1.jpg"}
            alt={album.titulo}
            className="h-48 w-full object-cover"
          />
        </div>
      )}
    >
      <div className="flex flex-col h-full justify-between">
        <div>
          <h5 className="truncate text-xl font-bold tracking-tight text-gray-900 dark:text-white line-clamp-1" title={album.titulo}>
            {album.titulo}
          </h5>
          <div className="h-6 mb-4">
            {album.ano && (
              <p className="font-normal text-gray-700 dark:text-gray-400">
                {album.ano}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onManageImages(); }}
          className="w-full mt-2 px-3 py-2 text-sm font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
        >
          Gerenciar Capas
        </button>
      </div>
    </Card>
  );
}
