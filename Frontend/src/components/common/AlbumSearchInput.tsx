import { useEffect, useRef, useState } from "react";
import { Label, Spinner, TextInput, Button } from "flowbite-react";
import type { Album } from "../../services/albunsService";

interface AlbumSearchInputProps {
    value: string;
    results: Album[];
    loading: boolean;
    onChange: (value: string) => void;
    onSelect: (album: Album) => void;
    label?: string;
    placeholder?: string;
    emptyMessage?: string;
    hasError?: boolean;
    disabled?: boolean;
    inputId?: string;
}

export default function AlbumSearchInput({
    value,
    results,
    loading,
    onChange,
    onSelect,
    label = "Álbum",
    placeholder = "Buscar álbum...",
    emptyMessage = "Nenhum álbum encontrado",
    hasError = false,
    disabled = false,
    inputId = "album-search",
}: AlbumSearchInputProps) {
    const [isOpen, setIsOpen] = useState(false);
    const blurTimeout = useRef<number | null>(null);

    const hasQuery = value.trim().length > 0;
    const emptyStateMessage = hasQuery ? emptyMessage : "Digite para buscar";
    const showEmptyState = !loading && results.length === 0;

    const cancelBlurClose = () => {
        if (blurTimeout.current) {
            window.clearTimeout(blurTimeout.current);
            blurTimeout.current = null;
        }
    };

    const scheduleBlurClose = () => {
        cancelBlurClose();
        blurTimeout.current = window.setTimeout(() => setIsOpen(false), 120);
    };

    useEffect(() => () => cancelBlurClose(), []);

    return (
        <div className="relative w-full">
            <div className="mb-2 block">
                <Label htmlFor={inputId}>{label}</Label>
            </div>

            <TextInput
                id={inputId}
                placeholder={placeholder}
                value={value}
                autoComplete="off"
                color={hasError ? "failure" : "gray"}
                disabled={disabled}
                onFocus={() => !disabled && setIsOpen(true)}
                onClick={() => !disabled && setIsOpen(true)}
                onBlur={scheduleBlurClose}
                onKeyDown={(e) => {
                    if (e.key === "Escape") {
                        setIsOpen(false);
                    }
                }}
                onChange={(e) => {
                    onChange(e.target.value);
                    if (!disabled) setIsOpen(true);
                }}
            />

            {isOpen && !disabled && (
                <div
                    className="absolute z-50 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800"
                    onMouseDown={cancelBlurClose}
                >
                    <div className="max-h-60 overflow-y-auto p-1 text-sm text-gray-700 dark:text-gray-200">
                        {loading && (
                            <div className="flex items-center gap-2 rounded-md px-3 py-2 text-gray-500 dark:text-gray-400">
                                <Spinner size="sm" />
                                <span>Carregando...</span>
                            </div>
                        )}

                        {results.length > 0 && (
                            <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                                {results.map((album) => (
                                    <li key={album.id} className="px-0">
                                        <Button
                                            type="button"
                                            color="white"
                                            size="sm"
                                            onMouseDown={(e) => {
                                                e.preventDefault();
                                                cancelBlurClose();
                                                onSelect(album);
                                                setIsOpen(false);
                                            }}
                                            className="w-full justify-between"
                                        >
                                            <span className="font-medium text-gray-900 dark:text-white">
                                                {album.titulo}
                                            </span>

                                            {album.ano && (
                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                                    {album.ano}
                                                </span>
                                            )}
                                        </Button>
                                    </li>
                                ))}

                            </ul>
                        )}

                        {showEmptyState && (
                            <div className="px-3 py-2 text-gray-500 dark:text-gray-400">{emptyStateMessage}</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
