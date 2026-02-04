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
import { getErrorMessage } from "../lib/http";
import { useToast } from "../contexts/ToastContext";
import { type Album } from "../services/albunsService";
import { albumsFacade } from "../facades/AlbumsFacade";
import { useBehaviorSubjectValue } from "../hooks/useBehaviorSubjectValue";

interface EditAlbumModalProps {
  show: boolean;
  album: Album | null;
  onClose: () => void;
  onSuccess: (album: Album) => void;
}

export default function EditAlbumModal({
  show,
  album,
  onClose,
  onSuccess,
}: EditAlbumModalProps) {
  const { addToast } = useToast();

  const handleYearChange = (value: string) => {
    const digitsOnly = value.replace(/\D/g, "").slice(0, 4);
    setAno(digitsOnly);
  };

  const loading = useBehaviorSubjectValue(albumsFacade.loading$);
  const facadeError = useBehaviorSubjectValue(albumsFacade.error$);

  const [titulo, setTitulo] = useState("");
  const [ano, setAno] = useState("");
  const [didSubmit, setDidSubmit] = useState(false);

  useEffect(() => {
    if (!show) return;
    setTitulo(album?.titulo ?? "");
    setAno(album?.ano != null ? String(album.ano) : "");
    setDidSubmit(false);
  }, [show, album?.id, album?.titulo, album?.ano]);

  const handleSave = async () => {
    if (!album) return;
    setDidSubmit(true);

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
      const updated = await albumsFacade.updateAlbum(album.id, {
        titulo: trimmedTitulo,
        ano: anoValue,
      });
      addToast("Álbum atualizado com sucesso!", "success");
      onSuccess(updated);
      onClose();
    } catch (err) {
      const message = getErrorMessage(err, "Erro ao atualizar álbum.");
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
                disabled={loading}
                color={didSubmit && !titulo.trim() ? "failure" : "gray"}
              />
            </div>

            <div>
              <div className="mb-2 block">
                <Label htmlFor="edit-album-ano">Ano de Lançamento</Label>
              </div>
              <TextInput
                id="edit-album-ano"
                type="text"
                inputMode="numeric"
                maxLength={4}
                placeholder="Ex: 2000"
                value={ano}
                onChange={(e) => handleYearChange(e.target.value)}
                disabled={loading}
              />
            </div>

            {facadeError && (
              <div className="text-sm text-red-600">{facadeError}</div>
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          <div className="flex gap-2">
            <Button color="gray" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !album}>
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

