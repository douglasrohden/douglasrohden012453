import http from "../lib/http";

export interface Regional {
    id?: number; // PK auto-incremento (opcional no frontend)
    externalId: number; // Identificador externo
    nome: string;
    ativo: boolean;
}

export const regionalService = {
    getAll: async () => {
        const response = await http.get<Regional[]>("/regionais");
        return response.data;
    },

    sync: async () => {
        const response = await http.post<{ inserted: number; inactivated: number; changed: number }>("/regionais/sync");
        return response.data;
    },
};
