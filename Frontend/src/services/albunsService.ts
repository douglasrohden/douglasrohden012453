import http from "../lib/http";
import { Page } from "../types/Page";

export interface Album {
  id: number;
  titulo: string;
  ano?: number;
  artistaNome?: string;
  individual?: boolean;
  capaUrl?: string | null;
  temCantor?: boolean;
  temBanda?: boolean;
  apenasCantores?: boolean;
  apenasBandas?: boolean;
}

export interface AlbumImage {
  id: number;
  url: string;
  expiresAt: string;
  objectKey: string;
  contentType: string;
  sizeBytes: number;
}

export type GetAlbunsFilters = {
  titulo?: string;
  ano?: number;
  artistaNome?: string;
  artistaTipo?: string;
  apenasArtistaTipo?: string;
};

export async function getAlbuns(
  page = 0,
  size = 10,
  filters: GetAlbunsFilters = {},
): Promise<Page<Album>> {
  const params: Record<string, string | number> = { page, size };
  if (filters.titulo) params.titulo = filters.titulo;
  if (filters.ano !== undefined) params.ano = filters.ano;
  if (filters.artistaNome) params.artistaNome = filters.artistaNome;
  if (filters.artistaTipo) params.artistaTipo = filters.artistaTipo;
  if (filters.apenasArtistaTipo)
    params.apenasArtistaTipo = filters.apenasArtistaTipo;

  const response = await http.get<Page<Album>>("/albuns", { params });
  return response.data;
}

export async function createAlbum(data: {
  titulo: string;
  ano?: number;
  artistaIds?: number[];
  individual?: boolean;
}): Promise<Album | Album[]> {
  const response = await http.post<Album | Album[]>("/albuns", data);
  return response.data;
}

export async function updateAlbum(
  albumId: number,
  data: { titulo: string; ano?: number },
): Promise<Album> {
  const response = await http.put<Album>(`/albuns/${albumId}`, data);
  return response.data;
}

export async function searchAlbums(
  query: string,
  page = 0,
  size = 10,
): Promise<Page<Album>> {
  const response = await http.get<Page<Album>>("/albuns", {
    params: { titulo: query, page, size },
  });
  return response.data;
}

export async function getAlbumImages(albumId: number): Promise<AlbumImage[]> {
  const response = await http.get<AlbumImage[]>(`/albuns/${albumId}/capas`);
  return response.data;
}

export async function uploadAlbumImages(
  albumId: number,
  files: File[],
): Promise<AlbumImage[]> {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));
  const response = await http.post<AlbumImage[]>(
    `/albuns/${albumId}/capas`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    },
  );
  return response.data;
}

export async function deleteAlbumImage(
  albumId: number,
  imageId: number,
): Promise<void> {
  await http.delete(`/albuns/${albumId}/capas/${imageId}`);
}
