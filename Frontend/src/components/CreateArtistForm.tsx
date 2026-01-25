import {
  Button,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  TextInput,
  Select,
  Label,
  FileInput,
  Badge,
} from "flowbite-react";
import { artistsFacade } from "../facades/ArtistsFacade";
import { useEffect, useMemo, useState } from "react";
import { useToast } from "../contexts/ToastContext";
import { getErrorMessage } from "../lib/http";
import type { Album } from "../services/albunsService";
import AlbumSearchInput from "./common/AlbumSearchInput";
import { AlbumsFacade } from "../facades/AlbumsFacade";
import { useBehaviorSubjectValue } from "../hooks/useBehaviorSubjectValue";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

export default function CreateArtistForm({
  isOpen,
  onClose,
  onCreated,
}: Props) {
  const { addToast } = useToast();
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState("CANTOR");
  const loading = useBehaviorSubjectValue(artistsFacade.loading$);
  const facadeError = useBehaviorSubjectValue(artistsFacade.error$);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [selectedAlbums, setSelectedAlbums] = useState<Album[]>([]);
  const [albumSearch, setAlbumSearch] = useState("");

  const albumsLookupFacade = useMemo(() => new AlbumsFacade(), []);
  const albumsLookupData = useBehaviorSubjectValue(albumsLookupFacade.data$);
  const albumsLoading = useBehaviorSubjectValue(albumsLookupFacade.loading$);

  useEffect(() => {
    albumsLookupFacade.setQuery(albumSearch);
  }, [albumsLookupFacade, albumSearch]);

  const searchResults = albumsLookupData?.content ?? [];

  // Note: We use local loading/error for the modal form feedback, 
  // even though Facade has global loading/error. This prevents global UI flicker
  // or confusing error messages on the main list while a modal is open.
  // We re-throw from Facade so we can catch here.

  const filteredAlbums = searchResults.filter(
    (a) => !selectedAlbums.some((selected) => selected.id === a.id),
  );

  const handleNameChange = (value: string) => {
    setNome(value);
  };

  const handleTipoChange = (value: string) => {
    setTipo(value);
  };

  const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5MB por arquivo
  const MAX_TOTAL_BYTES = 25 * 1024 * 1024; // 25MB por requisição

  const handleFilesChange = (fileList: FileList | null) => {
    if (!fileList) return;

    const newFiles = Array.from(fileList);
    const combinedFiles = [...files, ...newFiles];

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

  const handleAlbumSearchChange = (value: string) => {
    setAlbumSearch(value);
  };

  const selectAlbum = (album: Album) => {
    if (!selectedAlbums.find((a) => a.id === album.id)) {
      setSelectedAlbums([...selectedAlbums, album]);
    }
    setAlbumSearch("");
  };

  const removeAlbum = (id: number) => {
    setSelectedAlbums(selectedAlbums.filter((a) => a.id !== id));
  };

  const handleSave = async () => {
    if (!nome.trim()) {
      addToast("Nome é obrigatório", "warning");
      return;
    }
    try {
      await artistsFacade.create(
        {
          nome: nome.trim(),
          tipo: tipo,
          albumIds: selectedAlbums.map((a) => a.id),
        },
        files,
      );

      addToast("Artista criado com sucesso!", "success");
      onCreated?.(); // Refresh triggered by facade but we might want to ensure it? Facade create calls refresh(), so maybe redundant but harmless.
      onClose();

      // Reset form
      setNome("");
      setTipo("CANTOR");
      setFiles([]);
      setPreviews([]);
      setSelectedAlbums([]);
      setAlbumSearch("");
    } catch (err: unknown) {
      // Facade sets global error, but we also want local error in modal.
      const msg = getErrorMessage(err, "Erro ao criar artista");
      addToast(msg, "error");
    }
  };

  return (
    <Modal show={isOpen} size="md" onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSave();
        }}
      >
        <ModalHeader> Criar artista </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <div>
              <div className="mb-2 block">
                <Label htmlFor="artist-nome">Nome</Label>
              </div>
              <TextInput
                id="artist-nome"
                value={nome}
                onChange={(e) => handleNameChange(e.target.value)}
              />
            </div>

            <div>
              <div className="mb-2 block">
                <Label htmlFor="artist-tipo">Tipo</Label>
              </div>
              <Select
                id="artist-tipo"
                value={tipo}
                onChange={(e) => handleTipoChange(e.target.value)}
              >
                <option value="CANTOR">Cantor</option>
                <option value="BANDA">Banda</option>
              </Select>
            </div>

            <div>
              <AlbumSearchInput
                value={albumSearch}
                results={filteredAlbums}
                loading={albumsLoading}
                onChange={handleAlbumSearchChange}
                onSelect={selectAlbum}
                label="Álbuns (opcional)"
                placeholder="Buscar álbuns para associar..."
                inputId="artist-albums"
              />
              {selectedAlbums.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedAlbums.map((album) => (
                    <Badge key={album.id} color="info" size="sm">
                      <div className="flex items-center gap-1">
                        <span>{album.titulo}</span>
                        {album.ano && (
                          <span className="text-xs">({album.ano})</span>
                        )}
                        <button
                          type="button"
                          onClick={() => removeAlbum(album.id)}
                          className="ml-1 hover:text-red-600"
                          aria-label="Remover álbum"
                        >
                          ×
                        </button>
                      </div>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className="mb-2 block">
                <Label htmlFor="artist-images">
                  Imagens do Artista (Adicionar múltiplas)
                </Label>
              </div>
              <div className="flex flex-col gap-2">
                <FileInput
                  id="artist-images"
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

            {facadeError && (
              <div className="text-sm text-red-600">{String(facadeError)}</div>
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          <div className="flex gap-2">
            <Button color="gray" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Criar"}
            </Button>
          </div>
        </ModalFooter>
      </form>
    </Modal>
  );
}
