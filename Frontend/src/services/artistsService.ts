import api from "../config/axiosConfig";
import { Page } from "../types/Page";

export interface Artista {
    id: number;
    nome: string;
    genero: string;
    imageUrl?: string;
}

export const artistsService = {
    getAll: async (page = 0, size = 10, search?: string) => {
        const params: any = { page, size };
        if (search) {
            params.search = search;
        }
        const response = await api.get<Page<Artista>>("/artistas", { params });
        return response.data;
    },

    getById: async (id: number) => {
        const response = await api.get<Artista>(`/artistas/${id}`);
        return response.data;
    },
};
