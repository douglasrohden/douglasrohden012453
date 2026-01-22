import { useEffect, useRef, useState } from "react";
import { Label, Spinner, TextInput, Button } from "flowbite-react";
import type { Artista } from "../../services/artistsService";

interface ArtistSearchInputProps {
  value: string;
  results: Artista[];
  loading: boolean;
  onChange: (value: string) => void;
  onSelect: (artist: Artista) => void;
  label?: string;
  placeholder?: string;
  emptyMessage?: string;
  hasError?: boolean;
  disabled?: boolean;
  inputId?: string;
}

export default function ArtistSearchInput({
  value,
  results,
  loading,
  onChange,
  onSelect,
  label = "Artista",
  placeholder = "Buscar artista...",
  emptyMessage = "Nenhum artista encontrado",
  hasError = false,
  disabled = false,
  inputId = "artist-search",
}: ArtistSearchInputProps) {
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
        onBlur={scheduleBlurClose}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setIsOpen(false);
          }
        }}
        onChange={(e) => {
          onChange(e.target.value);
          if (!disabled) setIsOpen(true); // abre enquanto digita
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
                {results.map((artist) => (
                  <li key={artist.id} className="px-0">
                    <Button
                      color="white"
                      size="sm"
                      onClick={() => {
                        onSelect(artist);
                        setIsOpen(false);
                      }}
                      className="w-full flex items-center justify-between rounded-md px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <span className="font-medium text-gray-900 dark:text-white">{artist.nome}</span>
                      {artist.genero && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">{artist.genero}</span>
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
