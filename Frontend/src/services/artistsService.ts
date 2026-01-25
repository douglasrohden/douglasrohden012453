import api from "../api/client";
import { Page } from "../types/Page";

export interface Artista {
  id: number;
  nome: string;
  tipo?: string;
  albumCount?: number;
  albuns?: Album[];
}

export interface Album {
  id: number;
  titulo: string;
  ano?: number;
}

export interface ArtistImage {
  id: number;
  url: string;
  expiresAt: string;
  objectKey: string;
  contentType: string;
  sizeBytes: number;
}

export const artistsService = {
  getAll: async (
    page = 0,
    size = 10,
    search?: string,
    sort?: string,
    dir?: string,
    tipo?: string,
  ) => {
    const params: Record<string, string | number> = { page, size };
    if (search) {
      params.q = search;
    }
    if (tipo && tipo !== "TODOS") params.tipo = tipo;
    if (sort) params.sort = sort;
    if (dir) params.dir = dir;
    const response = await api.get<Page<Artista>>("/artistas", { params });
    return response.data;
  },

  getById: async (id: number) => {
    const response = await api.get<Artista>(`/artistas/${id}`);
    return response.data as Artista & { albuns?: Album[] };
  },
  create: async (payload: {
    nome: string;
    tipo?: string;
    albumIds?: number[];
  }) => {
    const response = await api.post<Artista>("/artistas", payload);
    return response.data;
  },
  addAlbum: async (id: number, payload: { titulo: string; ano?: number }) => {
    // Retorna o artista com o álbum recém-criado; usamos o id do novo álbum para subir as capas.
    const response = await api.post<Artista & { albuns?: Album[] }>(
      `/artistas/${id}/albuns`,
      payload,
    );
    return response.data;
  },
};

export async function getArtistImages(
  artistaId: number,
): Promise<ArtistImage[]> {
  const response = await api.get<ArtistImage[]>(
    `/artistas/${artistaId}/imagens`,
  );
  return response.data;
}

export async function uploadArtistImages(
  artistaId: number,
  files: File[],
): Promise<ArtistImage[]> {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));
  const response = await api.post(`/artistas/${artistaId}/imagens`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
}

export async function deleteArtistImage(
  artistaId: number,
  imageId: number,
): Promise<void> {
  await api.delete(`/artistas/${artistaId}/imagens/${imageId}`);
}
