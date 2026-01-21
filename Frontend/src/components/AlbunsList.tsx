
import { Pagination, Card, Spinner, TextInput, Select, Button } from 'flowbite-react';
import { useAlbuns } from '../hooks/useAlbuns';
import { useToast } from '../contexts/ToastContext';
import { useEffect, useState } from 'react';
import { HiSearch } from 'react-icons/hi';

export default function AlbunsList() {
  const { albuns, loading, error, page, totalPages, setPage } = useAlbuns();
  const { addToast } = useToast();

  useEffect(() => {
    if (error) {
      addToast(error, "error");
    }
  }, [error, addToast]);

  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("titulo");

  if (loading) return (
    <div className="flex justify-center p-10">
      <Spinner size="xl" aria-label="Carregando álbuns..." />
    </div>
  );

  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Álbuns</h2>
      </div>

      <div className="mb-6 flex flex-col items-center justify-between gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 md:flex-row">
        <div className="w-full md:w-1/3">
          <TextInput
            id="search-albuns"
            type="text"
            icon={HiSearch}
            placeholder="Buscar álbum..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row md:items-center">
          <Select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="titulo">Ordenar por Título</option>
            <option value="ano">Ordenar por Ano</option>
          </Select>
          <Button color="light" onClick={() => addToast("Funcionalidade em breve", "warning")}>
            Filtrar
          </Button>
        </div>
      </div>

      {albuns.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10">
          <p className="text-gray-500 dark:text-gray-400">Nenhum álbum encontrado.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mb-6">
            {albuns.map((album: any) => (
              <Card
                key={album.id}
                className="max-w-sm transition-shadow hover:shadow-lg"
                imgAlt={album.titulo}
                imgSrc={album.imageUrl || "https://flowbite.com/docs/images/blog/image-1.jpg"}
              >
                <h5 className="truncate text-xl font-bold tracking-tight text-gray-900 dark:text-white" title={album.titulo}>
                  {album.titulo}
                </h5>
                {album.ano && (
                  <p className="font-normal text-gray-700 dark:text-gray-400">
                    {album.ano}
                  </p>
                )}
              </Card>
            ))}
          </div>

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
        </>
      )}
    </div>
  );
}
