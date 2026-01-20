export interface ApiResponse<T> {
    data: T;
}

// Reusable small types for paginated responses or errors can be added here
export interface PaginatedResponse<T> {
    items: T[];
    total: number;
}
