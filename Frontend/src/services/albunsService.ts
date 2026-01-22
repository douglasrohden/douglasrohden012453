import api from "../api/client";
import { Page } from '../types/Page'

export interface Album {
  id: number;
  titulo: string;
  ano?: number;
  imageUrl?: string;
  artistaNome?: string;
}

export async function getAlbuns(page = 0, size = 10): Promise<Page<Album>> {
  const response = await api.get<Page<Album>>('/albuns', { params: { page, size } })
  return response.data
}

export async function createAlbum(data: { titulo: string; ano?: number; imageUrl?: string }): Promise<Album> {
  const response = await api.post<Album>('/albuns', data)
  return response.data
}