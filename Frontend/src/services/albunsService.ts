import api from '../config/axiosConfig'
import { Page } from '../types/Page'

export interface Album {
  id: number;
  titulo: string;
  ano?: number;
  imageUrl?: string;
}

export async function getAlbuns(page = 0, size = 10): Promise<Page<Album>> {
  const response = await api.get<Page<Album>>('/albuns', { params: { page, size } })
  return response.data
}