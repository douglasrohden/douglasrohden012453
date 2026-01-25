import { Pagination, Card, Alert } from "flowbite-react";
import { useEffect, useState } from "react";
import { HiSearch, HiClock, HiPencil } from "react-icons/hi";
import { CardGrid } from "./common/CardGrid";
import { ListToolbar } from "./common/ListToolbar";
import CreateAlbumForm from "./CreateAlbumForm";
import ManageAlbumImagesModal from "./ManageAlbumImagesModal";
import type { Album } from "../services/albunsService";
import EditAlbumModal from "./EditAlbumModal";
import { albunsFacade } from "../facades/AlbumsFacade";
import { useBehaviorSubjectValue } from "../hooks/useBehaviorSubjectValue";

export default function AlbunsList() {
  const data = useBehaviorSubjectValue(albunsFacade.data$);
  const params = useBehaviorSubjectValue(albunsFacade.params$);
  const loading = useBehaviorSubjectValue(albunsFacade.loading$);
  const error = useBehaviorSubjectValue(albunsFacade.error$);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState<Album | null>(null);
  const [manageImagesAlbumId, setManageImagesAlbumId] = useState<number | null>(
    null,
  );

  useEffect(() => {
    // garante carregamento inicial caso esta lista seja usada fora da página
    if (!loading && (data?.content?.length ?? 0) === 0) {
      albunsFacade.load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        query={params.search}
        onQueryChange={(q) => albunsFacade.setQuery(q)}
        queryPlaceholder="Buscar álbum..."
        queryId="search-albuns"
        searchIcon={HiSearch}
        sortField={params.sortField}
        onSortFieldChange={(v) =>
          albunsFacade.setSortField(v as "titulo" | "ano")
        }
        sortFieldId="sort-albuns"
        sortFieldLabel="Ordenar por"
        sortFieldOptions={[
          { value: "titulo", label: "Título" },
          { value: "ano", label: "Ano" },
        ]}
        sortDir={params.sortDir}
        onSortDirChange={(d) => albunsFacade.setSortDir(d)}
        sortDirId="sort-dir-albuns"
        sortDirLabel="Ordem"
        addLabel="Adicionar"
        onAdd={() => setShowCreateModal(true)}
      />

      <CardGrid
        loading={loading}
        isEmpty={(data?.content?.length ?? 0) === 0}
        emptyMessage="Nenhum álbum encontrado."
      >
        {(data?.content ?? []).map((album) => (
          <AlbumCard
            key={album.id}
            album={album}
            onEdit={() => setEditingAlbum(album)}
            onManageImages={() => setManageImagesAlbumId(album.id)}
          />
        ))}
      </CardGrid>

      {(data?.totalPages ?? 0) > 1 && (
        <div className="mt-8 flex justify-center">
          <Pagination
            currentPage={(params.page ?? 0) + 1}
            totalPages={data?.totalPages ?? 0}
            onPageChange={(p) => albunsFacade.setPage(p - 1)}
            showIcons
            previousLabel="Anterior"
            nextLabel="Próxima"
          />
        </div>
      )}

      <CreateAlbumForm
        show={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => albunsFacade.refresh()}
      />

      <EditAlbumModal
        show={!!editingAlbum}
        album={editingAlbum}
        onClose={() => setEditingAlbum(null)}
        onSuccess={(updated) => {
          albunsFacade.updateAlbumInState(updated);
          albunsFacade.refresh();
        }}
      />

      <ManageAlbumImagesModal
        show={!!manageImagesAlbumId}
        albumId={manageImagesAlbumId}
        onClose={() => {
          setManageImagesAlbumId(null);
          albunsFacade.refresh();
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
        <div>
          {album.artistaNome && (
            <div className="px-4 pt-4 pb-2">
              <p className="text-sm font-semibold tracking-wide text-gray-600 uppercase dark:text-gray-400">
                <span className="mr-2">Artista:</span>
                <span className="normal-case">{album.artistaNome}</span>
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <span className="mr-2 font-semibold">Cantor/Banda:</span>
                <span>
                  {album.apenasBandas
                    ? "Banda"
                    : album.apenasCantores
                      ? "Cantor(a)"
                      : album.temBanda && album.temCantor
                        ? "Vários"
                        : album.individual === true
                          ? "Cantor(a)"
                          : album.individual === false
                            ? "Banda"
                            : "—"}
                </span>
              </p>
            </div>
          )}
          <div className="group relative">
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
                Ano:
              </span>
              <span>{album.ano ?? "—"}</span>
            </p>
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
