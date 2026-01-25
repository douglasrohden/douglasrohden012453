import { Pagination, Select, Card, Label } from "flowbite-react";
import { PageLayout } from "../components/layout/PageLayout";
import CreateArtistForm from "../components/CreateArtistForm";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CardGrid } from "../components/common/CardGrid";
import { ListToolbar } from "../components/common/ListToolbar";
import { useArtists } from "../hooks/useArtists";

export default function HomePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showCreate, setShowCreate] = useState(false);
  const [navLock, setNavLock] = useState(false);

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

      <CardGrid
        loading={loading}
        isEmpty={artists.length === 0}
        emptyMessage="Nenhum artista encontrado."
      >
        {artists.map((artist) => (
          <Card
            key={artist.id}
            className="h-full cursor-pointer transition-shadow hover:shadow-lg"
            imgAlt={artist.nome}
            imgSrc={"https://flowbite.com/docs/images/blog/image-1.jpg"}
            onClick={() => {
              if (navLock) return;
              setNavLock(true);
              navigate(`/artista/${artist.id}`);
            }}
          >
            <h5
              className="line-clamp-1 text-2xl font-bold tracking-tight text-gray-900 dark:text-white"
              title={artist.nome}
            >
              <span className="mr-2 text-sm font-semibold text-gray-600 dark:text-gray-400">
                Nome:
              </span>
              <span className="normal-case">{artist.nome ?? "—"}</span>
            </h5>
            <p className="line-clamp-1 h-6 font-normal text-gray-700 dark:text-gray-400">
              <span className="mr-2 text-sm font-semibold text-gray-600 dark:text-gray-400">
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

            {typeof artist.albumCount === "number" && (
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                <span className="mr-2 text-sm font-semibold text-gray-600 dark:text-gray-400">
                  Álbuns:
                </span>
                {artist.albumCount}{" "}
                {artist.albumCount === 1 ? "álbum" : "álbuns"}
              </p>
            )}

            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/artista/${artist.id}`);
              }}
              className="mt-4 w-full rounded-lg bg-blue-700 px-3 py-2 text-center text-sm font-medium text-white hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 focus:outline-none dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
            >
              Álbuns
            </button>
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
