import { ReactNode } from "react";
import { LoadingSpinner } from "./LoadingSpinner";
import { EmptyState } from "./EmptyState";

interface CardGridProps {
    children: ReactNode;
    loading?: boolean;
    isEmpty?: boolean;
    emptyMessage?: string;
    loadingMessage?: string;
}

export function CardGrid({
    children,
    loading = false,
    isEmpty = false,
    emptyMessage = "Nenhum item encontrado.",
    loadingMessage = "Carregando..."
}: CardGridProps) {
    if (loading) {
        return <LoadingSpinner message={loadingMessage} />;
    }

    if (isEmpty) {
        return <EmptyState message={emptyMessage} />;
    }

    return (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {children}
        </div>
    );
}
