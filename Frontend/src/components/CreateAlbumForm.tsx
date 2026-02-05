import { useState, useEffect } from "react";
import {
  Button,
  Label,
  TextInput,
  Modal,
  ModalBody,
  ModalHeader,
  ModalFooter,
  FileInput,
  Spinner,
} from "flowbite-react";
import { useToast } from "../contexts/ToastContext";
import type { Artista } from "../services/artistsService";
import { getErrorMessage } from "../lib/http";
import { useArtists } from "../hooks/useArtists";
import ArtistSearchInput from "./common/ArtistSearchInput";
import { albumsFacade } from "../facades/AlbumsFacade";
import { artistDetailFacade } from "../facades/ArtistDetailFacade";
import { useBehaviorSubjectValue } from "../hooks/useBehaviorSubjectValue";

function ArtistSelector({
  value,
  onChange,
  onSelect,
  hasError,
}: {
  value: string;
  onChange: (value: string) => void;
  onSelect: (artist: Artista) => void;
  hasError: boolean;
}) {
  const {
    artists: searchResults,
    loading: searchLoading,
    setSearch: setArtistSearch,
    setPage: setArtistPage,
  } = useArtists();

  const handleArtistSearchChange = (next: string) => {
    onChange(next);
    setArtistSearch(next);
    setArtistPage(0);
  };

  const handleSelect = (artist: Artista) => {
    onSelect(artist);
    // limpar o campo de busca após selecionar o artista
    onChange("");
    setArtistSearch("");
  };

  return (
    <ArtistSearchInput
      value={value}
      results={searchResults}
      loading={searchLoading}
      onChange={handleArtistSearchChange}
      onSelect={handleSelect}
      hasError={hasError}
    />
  );
}

interface CreateAlbumFormProps {
  artistId?: number; // Made optional
  onSuccess: () => void;
  onClose: () => void;
  show: boolean;
}

export default function CreateAlbumForm({
  artistId,
  onSuccess,
  onClose,
  show,
}: CreateAlbumFormProps) {
  const { addToast } = useToast();
  const [titulo, setTitulo] = useState("");
  const [ano, setAno] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [didSubmit, setDidSubmit] = useState(false);

  // Artist selection state (multiple)
  const [selectedArtists, setSelectedArtists] = useState<Artista[]>([]);
  const [artistSearch, setArtistSearch] = useState("");

  const loading = useBehaviorSubjectValue(
    artistId ? artistDetailFacade.loading$ : albumsFacade.loading$,
  );

  // Reset form when modal opens/closes
  useEffect(() => {
    if (show) {
      setTitulo("");
      setAno("");
      setFiles([]);
      setPreviews([]);
      setDidSubmit(false);
      setArtistSearch("");
      // If artistId is provided via props, we don't need to select one,
      // but we don't necessarily have the full Artista object here.
      // We'll rely on the prop for submission if present.
      if (!artistId) {
        setSelectedArtists([]);
      }
    }
  }, [show, artistId]);

  const handleArtistSearchChange = (value: string) => {
    setArtistSearch(value);
  };

  const selectArtist = (artist: Artista) => {
    // add if not already selected
    if (!selectedArtists.some((a) => a.id === artist.id)) {
      setSelectedArtists((prev) => [...prev, artist]);
    }
    setArtistSearch("");
  };

  const removeArtist = (id: number) => {
    setSelectedArtists((prev) => prev.filter((a) => a.id !== id));
  };

  const handleTitleChange = (value: string) => {
    setTitulo(value);
  };

  const handleYearChange = (value: string) => {
    const digitsOnly = value.replace(/\D/g, "").slice(0, 4);
    setAno(digitsOnly);
  };

  const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5MB por arquivo
  const MAX_TOTAL_BYTES = 25 * 1024 * 1024; // 25MB por requisição

  const handleFilesChange = (fileList: FileList | null) => {
    if (!fileList) return;

    const newFiles = Array.from(fileList);
    const combinedFiles = [...files, ...newFiles];

    // Validate new files and total size
    const tooBig = newFiles.some((f) => f.size > MAX_FILE_BYTES);
    const totalTooBig =
      combinedFiles.reduce((acc, f) => acc + f.size, 0) > MAX_TOTAL_BYTES;

    if (tooBig) {
      addToast("Cada arquivo deve ter no máximo 5MB", "warning");
      return;
    }
    if (totalTooBig) {
      addToast("Tamanho total ultrapassa 25MB", "warning");
      return;
    }

    setFiles(combinedFiles);
    setPreviews(combinedFiles.map((f) => URL.createObjectURL(f)));
  };

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    setPreviews(newFiles.map((f) => URL.createObjectURL(f)));
  };

  const handleSave = async () => {
    setDidSubmit(true);

    const artistsToProcess = artistId
      ? [{ id: artistId, nome: "" }]
      : selectedArtists;
    const artistIds = artistsToProcess.map((a) => a.id);

    if (artistIds.length === 0) {
      addToast("Selecione pelo menos um artista", "warning");
      return;
    }

    const trimmedTitulo = titulo.trim();
    if (!trimmedTitulo) {
      addToast("Título é obrigatório", "warning");
      return;
    }

    if (trimmedTitulo.length > 255) {
      addToast("Título deve ter no máximo 255 caracteres", "warning");
      return;
    }

    const anoValue = ano.trim() ? Number(ano) : undefined;
    if (ano.trim() && ano.trim().length > 4) {
      addToast("Ano deve ter no máximo 4 dígitos", "warning");
      return;
    }
    if (ano.trim() && Number.isNaN(anoValue)) {
      addToast("Ano inválido", "warning");
      return;
    }

    try {
      if (artistId) {
        await artistDetailFacade.addAlbumToArtist(
          { titulo: trimmedTitulo, ano: anoValue },
          files,
        );
        addToast("Álbum adicionado com sucesso!", "success");
      } else {
        const created = await albumsFacade.createAlbum(
          {
            titulo: trimmedTitulo,
            ano: anoValue,
            artistaIds: artistIds,
          },
          files,
        );
        const createdCount = Array.isArray(created) ? created.length : 1;
        addToast(
          createdCount > 1
            ? "Álbuns adicionados com sucesso!"
            : "Álbum adicionado com sucesso!",
          "success",
        );
      }

      onSuccess();
      onClose();
    } catch (err) {
      const message = getErrorMessage(err, "Erro ao adicionar álbum.");
      // 429 já dispara toast global; aqui só evitamos duplicar quando possível.
      addToast(message, "error");
    }
  };

  return (
    <Modal show={show} onClose={onClose} size="md">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSave();
        }}
      >
        <ModalHeader>Adicionar Álbum</ModalHeader>
        <ModalBody>
          <div className="flex flex-col gap-4">
            {!artistId && show && (
              <div>
                <ArtistSelector
                  value={artistSearch}
                  onChange={handleArtistSearchChange}
                  onSelect={selectArtist}
                  hasError={didSubmit && selectedArtists.length === 0}
                />
                {selectedArtists.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedArtists.map((a) => (
                      <div
                        key={a.id}
                        className="flex items-center gap-2 rounded bg-gray-200 px-2 py-1"
                      >
                        <span className="text-sm">{a.nome}</span>
                        <button
                          type="button"
                          onClick={() => removeArtist(a.id)}
                          className="text-sm text-red-600"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {artistId && (
              <div className="text-sm text-gray-600">
                Vinculado ao artista selecionado.
              </div>
            )}

            <div>
              <div className="mb-2 block">
                <Label htmlFor="titulo">Título do Álbum</Label>
              </div>
              <TextInput
                id="titulo"
                placeholder="Ex: Hybrid Theory"
                value={titulo}
                onChange={(e) => handleTitleChange(e.target.value)}
                color={didSubmit && !titulo.trim() ? "failure" : "gray"}
              />
            </div>
            <div>
              <div className="mb-2 block">
                <Label htmlFor="ano">Ano de Lançamento</Label>
              </div>
              <TextInput
                id="ano"
                type="text"
                inputMode="numeric"
                maxLength={4}
                placeholder="Ex: 2000"
                value={ano}
                onChange={(e) => handleYearChange(e.target.value)}
              />
            </div>
            <div>
              <div className="mb-2 block">
                <Label htmlFor="capas">
                  Capas do Álbum (Adicionar múltiplas)
                </Label>
              </div>
              <div className="flex flex-col gap-2">
                <FileInput
                  id="capas"
                  multiple
                  accept="image/*"
                  onChange={(e) => {
                    handleFilesChange(e.target.files);
                    e.target.value = "";
                  }}
                />
                <span className="text-xs text-gray-500">
                  Máx 5MB por arquivo, 25MB total. Selecione mais arquivos para
                  adicionar à lista.
                </span>
              </div>
              {previews.length > 0 && (
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {previews.map((src, idx) => (
                    <div key={idx} className="group relative">
                      <img
                        src={src}
                        alt={`preview-${idx}`}
                        className="h-24 w-full rounded border border-gray-200 object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeFile(idx)}
                        className="absolute top-1 right-1 rounded-full bg-red-600 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                        title="Remover imagem"
                      >
                        <svg
                          className="h-3 w-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M6 18L18 6M6 6l12 12"
                          ></path>
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <div className="flex gap-2">
            <Button color="gray" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <Spinner size="sm" /> Salvando...
                </span>
              ) : (
                "Salvar"
              )}
            </Button>
          </div>
        </ModalFooter>
      </form>
    </Modal>
  );
}
