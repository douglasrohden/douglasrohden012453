
import { useAlbuns } from '../hooks/useAlbuns';
import { AlbumCard } from './AlbumCard';

export default function AlbunsList() {
  const { albuns, loading, error } = useAlbuns();

  if (loading) return (
    <div className="flex justify-center p-10">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
    </div>
  );

  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Álbuns</h2>

      {albuns.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">Nenhum álbum encontrado.</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {albuns.map((album: any) => (
            <AlbumCard
              key={album.id}
              title={album.titulo}
              year={album.ano}
            />
          ))}
        </div>
      )}
    </div>
  );
}
