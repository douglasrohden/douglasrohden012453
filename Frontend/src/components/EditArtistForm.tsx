import {
  Button,
  Label,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Select,
  TextInput,
  FileInput,
} from "flowbite-react";
import { artistsFacade } from "../facades/ArtistsFacade";
import { useEffect, useMemo, useState } from "react";
import { useToast } from "../contexts/ToastContext";
import { getErrorMessage } from "../lib/http";
import { useBehaviorSubjectValue } from "../hooks/useBehaviorSubjectValue";

type ArtistRef = {
  id: number;
  nome: string;
  tipo?: string;
};

interface Props {
  isOpen: boolean;
  artist: ArtistRef | null;
  onClose: () => void;
  onUpdated?: (artist: ArtistRef) => void;
}

export default function EditArtistForm({
  isOpen,
  artist,
  onClose,
  onUpdated,
}: Props) {
  const { addToast } = useToast();
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState("CANTOR");
  const loading = useBehaviorSubjectValue(artistsFacade.loading$);
  const error = useBehaviorSubjectValue(artistsFacade.error$);

  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  const current = useMemo(() => artist, [artist]);

  useEffect(() => {
    if (!isOpen || !current) return;
    setNome(current.nome ?? "");
    setTipo(current.tipo ?? "CANTOR");
    setFiles([]);
    setPreviews([]);
  }, [isOpen, current]);

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

  const handleSave = async () => {
    if (!current) return;
    if (!nome.trim()) {
      addToast("Nome é obrigatório", "warning");
      return;
    }

    try {
      const updated = await artistsFacade.update(
        current.id,
        {
          nome: nome.trim(),
          tipo,
        },
        files,
      );

      addToast("Artista atualizado com sucesso!", "success");
      onUpdated?.({
        id: updated.id,
        nome: updated.nome,
        tipo: updated.tipo,
      });
      onClose();
    } catch (err) {
      const msg = getErrorMessage(err, "Erro ao atualizar artista");
      addToast(msg, "error");
      // Warning: checking status to avoid double toast if Facade handles it globally?
      // But getHttpStatus is available helper.
      // const status = getHttpStatus(err);
      // if (status !== 429) addToast(msg, "error");
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
        <ModalHeader>Editar artista</ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <div>
              <div className="mb-2 block">
                <Label htmlFor="edit-artist-nome">Nome</Label>
              </div>
              <TextInput
                id="edit-artist-nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
              />
            </div>

            <div>
              <div className="mb-2 block">
                <Label htmlFor="edit-artist-tipo">Tipo</Label>
              </div>
              <Select
                id="edit-artist-tipo"
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
              >
                <option value="CANTOR">Cantor</option>
                <option value="BANDA">Banda</option>

              </Select>
            </div>

            <div>
              <div className="mb-2 block">
                <Label htmlFor="edit-artist-images">
                  Adicionar Imagens (opcional)
                </Label>
              </div>
              <div className="flex flex-col gap-2">
                <FileInput
                  id="edit-artist-images"
                  multiple
                  accept="image/*"
                  onChange={(e) => {
                    handleFilesChange(e.target.files);
                    e.target.value = "";
                  }}
                />
                <span className="text-xs text-gray-500">
                  Novas imagens serão adicionadas à galeria existente.
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

            {error && (
              <div className="text-sm text-red-600">{String(error)}</div>
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          <div className="flex gap-2">
            <Button color="gray" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !current}>
              {loading ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </ModalFooter>
      </form>
    </Modal>
  );
}

