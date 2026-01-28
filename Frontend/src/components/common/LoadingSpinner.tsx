import { Spinner } from "flowbite-react";

interface LoadingSpinnerProps {
  message?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

export function LoadingSpinner({
  message = "Carregando...",
  size = "xl",
}: LoadingSpinnerProps) {
  const hasMessage = Boolean(message?.trim());
  const ariaLabel = hasMessage ? message : "Carregando";
  return (
    <div className="flex flex-col items-center justify-center gap-3 p-10">
      <Spinner size={size} aria-label={ariaLabel} />
      {hasMessage ? (
        <p className="text-sm text-gray-600 dark:text-gray-300">{message}</p>
      ) : null}
    </div>
  );
}
