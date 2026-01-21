import { ReactNode } from "react";

interface EmptyStateProps {
    message: string;
    icon?: ReactNode;
}

export function EmptyState({ message, icon }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-10 gap-3">
            {icon && <div className="text-gray-400 dark:text-gray-500">{icon}</div>}
            <p className="text-gray-500 dark:text-gray-400">{message}</p>
        </div>
    );
}
