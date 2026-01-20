import React from 'react';
import { useAlbuns } from '../hooks/useAlbuns';

export default function AlbunsList() {
  const { albuns, loading, error } = useAlbuns();

  if (loading) return <div>Carregando álbuns...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div>
      <h2>Álbuns</h2>
      <ul>
        {albuns.map((album: any) => (
          <li key={album.id}>
            {album.titulo} {album.ano ? `(${album.ano})` : ''}
          </li>
        ))}
      </ul>
    </div>
  );
}
