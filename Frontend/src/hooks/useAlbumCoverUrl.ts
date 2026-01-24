import { useEffect, useState } from 'react';
import api from '../api/client';

export interface AlbumCover {
  id: number;
  url: string;
  expiresAt: string;
  objectKey: string;
  contentType: string;
  sizeBytes: number;
}

export function useAlbumCoverUrl(albumId?: number) {
  const [coverUrl, setCoverUrl] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!albumId) {
      setCoverUrl(undefined);
      return;
    }
    setLoading(true);
    api.get<AlbumCover[]>(`/albuns/${albumId}/capas`)
      .then((res) => {
        const covers = res.data;
        if (covers && covers.length > 0) {
          setCoverUrl(covers[0].url);
        } else {
          setCoverUrl(undefined);
        }
      })
      .catch(() => setCoverUrl(undefined))
      .finally(() => setLoading(false));
  }, [albumId]);

  return { coverUrl, loading };
}
