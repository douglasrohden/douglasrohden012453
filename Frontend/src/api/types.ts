export interface ApiResponse<T> {
    data: T;
}

// Reusable small types for paginated responses or errors can be added here
export interface PaginatedResponse<T> {
    items: T[];
    total: number;
}

export type ApiErrorBody = {
    message?: string;
    error?: string;
    details?: unknown;
};

export function getErrorMessage(err: unknown, fallback = 'Erro inesperado'): string {
    if (!err) return fallback;

    const anyErr = err as any;
    const axiosMessage = anyErr?.response?.data?.message ?? anyErr?.response?.data?.error;
    if (typeof axiosMessage === 'string' && axiosMessage.trim()) return axiosMessage;

    if (typeof anyErr?.message === 'string' && anyErr.message.trim()) return anyErr.message;
    return fallback;
}
