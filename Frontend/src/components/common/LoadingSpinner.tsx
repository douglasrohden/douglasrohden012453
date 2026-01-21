import { Spinner } from "flowbite-react";

interface LoadingSpinnerProps {
    message?: string;
    size?: "sm" | "md" | "lg" | "xl";
}

export function LoadingSpinner({ message = "Carregando...", size = "xl" }: LoadingSpinnerProps) {
    return (
        <div className="flex justify-center p-10">
            <Spinner size={size} aria-label={message} />
        </div>
    );
}
