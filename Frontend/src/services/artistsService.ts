import http from "../lib/http";
import { Page } from "../types/Page";

export interface Artista {
  id: number;
  nome: string;
  tipo?: string;
  albumCount?: number;
  albuns?: Album[];
  imageUrl?: string;
}

export interface Album {
  id: number;
  titulo: string;
  ano?: number;
  capaUrl?: string | null;
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
    const response = await http.get<Page<Artista>>("/artistas", { params });
    return response.data;
  },

  getById: async (id: number) => {
    const response = await http.get<Artista>(`/artistas/${id}`);
    return response.data as Artista & { albuns?: Album[] };
  },
  create: async (payload: {
    nome: string;
    tipo?: string;
    albumIds?: number[];
  }) => {
    const response = await http.post<Artista>("/artistas", payload);
    return response.data;
  },
  update: async (
    id: number,
    payload: { nome: string; tipo?: string; albumIds?: number[] },
  ) => {
    const response = await http.put<Artista>(`/artistas/${id}`, payload);
    return response.data;
  },
  addAlbum: async (id: number, payload: { titulo: string; ano?: number }) => {
    // Retorna o artista com o álbum recém-criado; usamos o id do novo álbum para subir as capas.
    const response = await http.post<Artista & { albuns?: Album[] }>(
      `/artistas/${id}/albuns`,
      payload,
    );
    return response.data;
  },
  delete: async (id: number) => {
    await http.delete(`/artistas/${id}`);
  },
};

export async function getArtistImages(
  artistaId: number,
): Promise<ArtistImage[]> {
  const response = await http.get<ArtistImage[]>(
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
  const response = await http.post(
    `/artistas/${artistaId}/imagens`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    },
  );
  return response.data;
}

export async function deleteArtistImage(
  artistaId: number,
  imageId: number,
): Promise<void> {
  await http.delete(`/artistas/${artistaId}/imagens/${imageId}`);
}
