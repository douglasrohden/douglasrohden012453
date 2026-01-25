import {
  Button,
  Label,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Select,
  TextInput,
} from "flowbite-react";
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { artistsService } from "../services/artistsService";
import { useToast } from "../contexts/ToastContext";
import { getErrorMessage } from "../api/client";

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const current = useMemo(() => artist, [artist]);

  useEffect(() => {
    if (!isOpen || !current) return;
    setNome(current.nome ?? "");
    setTipo(current.tipo ?? "CANTOR");
    setError(null);
  }, [isOpen, current]);

  const handleSave = async () => {
    if (!current) return;

    setError(null);
    if (!nome.trim()) {
      setError("Nome é obrigatório");
      return;
    }

    setLoading(true);
    try {
      const updated = await artistsService.update(current.id, {
        nome: nome.trim(),
        tipo,
      });

      addToast("Artista atualizado com sucesso!", "success");
      onUpdated?.({
        id: updated.id,
        nome: updated.nome,
        tipo: updated.tipo,
      });
      onClose();
    } catch (err) {
      const msg = getErrorMessage(err, "Erro ao atualizar artista");
      setError(msg);
      const status = axios.isAxiosError(err) ? err.response?.status : undefined;
      // 429 already triggers a global warning toast
      if (status !== 429) addToast(msg, "error");
    } finally {
      setLoading(false);
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

