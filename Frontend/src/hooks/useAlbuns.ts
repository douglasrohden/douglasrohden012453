import { useEffect, useState } from 'react';
import { getAlbuns } from '../services/albunsService';

export function useAlbuns() {
  const [albuns, setAlbuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAlbuns()
      .then(setAlbuns)
      .catch(() => setError('Erro ao buscar álbuns'))
      .finally(() => setLoading(false));
  }, []);

  return { albuns, loading, error };
}
