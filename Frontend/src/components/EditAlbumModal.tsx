import { useEffect, useState } from "react";
import {
  Button,
  Label,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Spinner,
  TextInput,
} from "flowbite-react";
import axios from "axios";
import { getErrorMessage } from "../api/client";
import { useToast } from "../contexts/ToastContext";
import { updateAlbum, type Album } from "../services/albunsService";

interface EditAlbumModalProps {
  show: boolean;
  album: Album | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditAlbumModal({
  show,
  album,
  onClose,
  onSuccess,
}: EditAlbumModalProps) {
  const { addToast } = useToast();

  const [titulo, setTitulo] = useState("");
  const [ano, setAno] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!show) return;
    setTitulo(album?.titulo ?? "");
    setAno(album?.ano != null ? String(album.ano) : "");
    setError(null);
    setIsSubmitting(false);
  }, [show, album?.id]);

  const handleSave = async () => {
    if (!album) return;
    setError(null);

    const trimmedTitulo = titulo.trim();
    if (!trimmedTitulo) {
      setError("Título é obrigatório");
      return;
    }

    if (trimmedTitulo.length > 255) {
      setError("Título deve ter no máximo 255 caracteres");
      return;
    }

    const anoValue = ano.trim() ? Number(ano) : undefined;
    if (ano.trim() && Number.isNaN(anoValue)) {
      setError("Ano inválido");
      return;
    }

    setIsSubmitting(true);
    try {
      await updateAlbum(album.id, { titulo: trimmedTitulo, ano: anoValue });
      addToast("Álbum atualizado com sucesso!", "success");
      onSuccess();
      onClose();
    } catch (err) {
      const message = getErrorMessage(err, "Erro ao atualizar álbum.");
      setError(message);
      const status = axios.isAxiosError(err) ? err.response?.status : undefined;
      if (status !== 429) addToast(message, "error");
    } finally {
      setIsSubmitting(false);
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
        <ModalHeader>Editar Álbum</ModalHeader>
        <ModalBody>
          <div className="flex flex-col gap-4">
            <div>
              <div className="mb-2 block">
                <Label htmlFor="edit-album-titulo">Título do Álbum</Label>
              </div>
              <TextInput
                id="edit-album-titulo"
                placeholder="Ex: Hybrid Theory"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                disabled={isSubmitting}
                color={
                  error?.toLowerCase().includes("título") ? "failure" : "gray"
                }
              />
            </div>

            <div>
              <div className="mb-2 block">
                <Label htmlFor="edit-album-ano">Ano de Lançamento</Label>
              </div>
              <TextInput
                id="edit-album-ano"
                type="number"
                placeholder="Ex: 2000"
                value={ano}
                onChange={(e) => setAno(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            {error && <div className="text-sm text-red-600">{error}</div>}
          </div>
        </ModalBody>
        <ModalFooter>
          <div className="flex gap-2">
            <Button color="gray" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || !album}>
              {isSubmitting ? (
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

