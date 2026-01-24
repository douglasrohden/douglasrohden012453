import api from "../api/client";
import { Page } from '../types/Page'

export interface Album {
  id: number;
  titulo: string;
  ano?: number;
  artistaNome?: string;
  capaUrl?: string | null;
}

export interface AlbumImage {
  id: number;
  url: string;
  expiresAt: string;
  objectKey: string;
  contentType: string;
  sizeBytes: number;
}

export async function getAlbuns(page = 0, size = 10): Promise<Page<Album>> {
  const response = await api.get<Page<Album>>('/albuns', { params: { page, size } })
  return response.data
}

export async function createAlbum(data: { titulo: string; ano?: number; artistaIds?: number[]; individual?: boolean }): Promise<Album | Album[]> {
  const response = await api.post<Album | Album[]>('/albuns', data)
  return response.data
}

export async function searchAlbums(query: string, page = 0, size = 10): Promise<Page<Album>> {
  const response = await api.get<Page<Album>>('/albuns', {
    params: { titulo: query, page, size }
  });
  return response.data;
}

export async function getAlbumImages(albumId: number): Promise<AlbumImage[]> {
  const response = await api.get<AlbumImage[]>(`/albuns/${albumId}/capas`);
  return response.data;
}

export async function uploadAlbumImages(albumId: number, files: File[]): Promise<any> {
  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));
  const response = await api.post(`/albuns/${albumId}/capas`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}

export async function deleteAlbumImage(albumId: number, imageId: number): Promise<void> {
  await api.delete(`/albuns/${albumId}/capas/${imageId}`);
}