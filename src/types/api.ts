export interface APIResponse<T> {
    data: T;
    message?: string;
    error?: string;
    success: boolean;
}

export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
