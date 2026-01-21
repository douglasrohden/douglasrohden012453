
import { Pagination, Card, Spinner } from 'flowbite-react';
import { useAlbuns } from '../hooks/useAlbuns';
import { useToast } from '../contexts/ToastContext';
import { useEffect } from 'react';

export default function AlbunsList() {
  const { albuns, loading, error, page, totalPages, setPage } = useAlbuns();
  const { addToast } = useToast();

  useEffect(() => {
    if (error) {
      addToast(error, "error");
    }
  }, [error, addToast]);

  if (loading) return (
    <div className="flex justify-center p-10">
      <Spinner size="xl" aria-label="Carregando álbuns..." />
    </div>
  );

  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Álbuns</h2>

      {albuns.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">Nenhum álbum encontrado.</p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mb-6">
            {albuns.map((album: any) => (
              <Card
                key={album.id}
                className="max-w-sm"
                imgAlt={album.titulo}
                imgSrc={album.imageUrl || "https://flowbite.com/docs/images/blog/image-1.jpg"}
              >
                <h5 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
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
