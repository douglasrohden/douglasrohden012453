import api from "../api/client";
import { Page } from '../types/Page'

export interface Album {
  id: number;
  titulo: string;
  ano?: number;
  artistaNome?: string;
}

export async function getAlbuns(page = 0, size = 10): Promise<Page<Album>> {
  const response = await api.get<Page<Album>>('/albuns', { params: { page, size } })
  return response.data
}

export async function createAlbum(data: { titulo: string; ano?: number; artistaIds?: number[] }): Promise<Album> {
  const response = await api.post<Album>('/albuns', data)
  return response.data
}

export async function uploadAlbumCovers(albumId: number, files: File[]): Promise<any> {
  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));
  const response = await api.post(`/albuns/${albumId}/capas`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}