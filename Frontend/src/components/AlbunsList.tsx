import { Pagination, Card } from 'flowbite-react';
import { useAlbuns } from '../hooks/useAlbuns';
import { useToast } from '../contexts/ToastContext';
import { useEffect, useMemo, useState } from 'react';
import { HiSearch } from 'react-icons/hi';
import { CardGrid } from './common/CardGrid';
import { ListToolbar } from './common/ListToolbar';
import CreateAlbumForm from './CreateAlbumForm';

interface Album {
  id: number;
  titulo: string;
  ano?: number;
  imageUrl?: string;
  artistaNome?: string;
}

export default function AlbunsList() {
  const { albuns, loading, error, page, totalPages, setPage } = useAlbuns();
  const { addToast } = useToast();

  useEffect(() => {
    if (error) {
      addToast(error, "error");
    }
  }, [error, addToast]);

  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState("titulo");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [showCreateModal, setShowCreateModal] = useState(false);

  const visibleAlbuns = useMemo(() => {
    const normalizedQuery = search.trim().toLowerCase();
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
  }, [albuns, search, sortField, sortDir]);

  if (error) return <div className="text-red-500">{error}</div>;

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
        loadingMessage="Carregando álbuns..."
      >
        {visibleAlbuns.map((album) => (
          <Card
            key={album.id}
            className="h-full transition-shadow hover:shadow-lg"
            renderImage={() => (
              <div>
                {album.artistaNome && (
                  <div className="px-4 pt-4 pb-2">
                    <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                      {album.artistaNome}
                    </p>
                  </div>
                )}
                <img
                  src={album.imageUrl || "https://flowbite.com/docs/images/blog/image-1.jpg"}
                  alt={album.titulo}
                  className="h-auto w-full object-cover"
                />
              </div>
            )}
          >
            <h5 className="truncate text-xl font-bold tracking-tight text-gray-900 dark:text-white line-clamp-1" title={album.titulo}>
              {album.titulo}
            </h5>
            <div className="h-6">
              {album.ano && (
                <p className="font-normal text-gray-700 dark:text-gray-400">
                  {album.ano}
                </p>
              )}
            </div>
          </Card>
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
    </div>
  );
}
