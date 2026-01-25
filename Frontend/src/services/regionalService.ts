import http from "../lib/http";

export interface Regional {
    id: number;
    nome: string;
    ativo: boolean;
}

export const regionalService = {
    getAll: async () => {
        const response = await http.get<Regional[]>("/regionais");
        return response.data;
    },
};
