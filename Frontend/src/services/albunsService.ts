import axios from '../config/axiosConfig'
import { Page } from '../types/Page'

export interface Album {
  id: number;
  titulo: string;
  ano?: number;
  imageUrl?: string;
}

export const getAlbuns = (page = 0, size = 12) => {
  return axios.get<Page<Album>>('/albuns', { params: { page, size } }).then(response => response.data)
}