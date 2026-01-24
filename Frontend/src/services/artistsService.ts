import api from "../api/client";
import { Page } from "../types/Page";

export interface Artista {
    id: number;
    nome: string;
    genero: string;
    albumCount?: number;
    albuns?: Album[];
}

export interface Album {
    id: number;
    titulo: string;
    ano?: number;
}

export const artistsService = {
    getAll: async (page = 0, size = 10, search?: string, sort?: string, dir?: string, tipo?: string) => {
        const params: Record<string, string | number> = { page, size };
        if (search) {
            params.q = search;
        }
        if (tipo && tipo !== 'TODOS') params.tipo = tipo;
        if (sort) params.sort = sort;
        if (dir) params.dir = dir;
        const response = await api.get<Page<Artista>>("/artistas", { params });
        return response.data;
    },

    getById: async (id: number) => {
        const response = await api.get<Artista>(`/artistas/${id}`);
        return response.data as Artista & { albuns?: Album[] };
    },
    create: async (payload: { nome: string; genero?: string; tipo?: string }) => {
        const response = await api.post<Artista>("/artistas", payload);
        return response.data;
    },
    addAlbum: async (id: number, payload: { titulo: string; ano?: number }) => {
        // Retorna o artista com o álbum recém-criado; usamos o id do novo álbum para subir as capas.
        const response = await api.post<Artista & { albuns?: Album[] }>(`/artistas/${id}/albuns`, payload);
        return response.data;
    },
};
