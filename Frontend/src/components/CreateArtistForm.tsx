import { Button, Modal, ModalBody, ModalFooter, ModalHeader, TextInput, Select, Label } from "flowbite-react";
import { useState } from "react";
import { artistsService } from "../services/artistsService";
import { useToast } from "../contexts/ToastContext";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onCreated?: () => void;
}

export default function CreateArtistForm({ isOpen, onClose, onCreated }: Props) {
    const { addToast } = useToast();
    const [nome, setNome] = useState("");
    const [genero, setGenero] = useState("");
    const [imageUrl, setImageUrl] = useState("");
    const [tipo, setTipo] = useState("CANTOR");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const submit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        setError(null);
        if (!nome.trim()) {
            setError("Nome é obrigatório");
            return;
        }
        setLoading(true);
        try {
            await artistsService.create({
                nome: nome.trim(),
                genero: genero.trim() || undefined,
                imageUrl: imageUrl.trim() || undefined,
                tipo: tipo
            });
            addToast("Artista criado com sucesso!", "success");
            onCreated?.();
            onClose();
            setNome("");
            setGenero("");
            setImageUrl("");
            setTipo("CANTOR");
        } catch (err: any) {
            const msg = err?.response?.data?.error || err?.response?.data || err?.message || "Erro ao criar artista";
            setError(msg);
            addToast(msg, "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal show={isOpen} size="md" onClose={onClose}>
            <form onSubmit={submit}>
                <ModalHeader> Criar artista </ModalHeader>
                <ModalBody>
                    <div className="space-y-4">
                        <div>
                            <div className="mb-2 block">
                                <Label htmlFor="artist-nome" value="Nome" />
                            </div>
                            <TextInput id="artist-nome" value={nome} onChange={(e) => setNome((e.target as HTMLInputElement).value)} />
                        </div>

                        <div>
                            <div className="mb-2 block">
                                <Label htmlFor="artist-genero" value="Gênero" />
                            </div>
                            <TextInput id="artist-genero" value={genero} onChange={(e) => setGenero((e.target as HTMLInputElement).value)} />
                        </div>

                        <div>
                            <div className="mb-2 block">
                                <Label htmlFor="artist-tipo" value="Tipo" />
                            </div>
                            <Select id="artist-tipo" value={tipo} onChange={(e) => setTipo(e.target.value)}>
                                <option value="CANTOR">Cantor</option>
                                <option value="BANDA">Banda</option>
                                <option value="DUPLA">Dupla</option>
                            </Select>
                        </div>

                        <div>
                            <div className="mb-2 block">
                                <Label htmlFor="artist-imageUrl" value="Image URL" />
                            </div>
                            <TextInput id="artist-imageUrl" value={imageUrl} onChange={(e) => setImageUrl((e.target as HTMLInputElement).value)} />
                        </div>

                        {error && <div className="text-sm text-red-600">{String(error)}</div>}
                    </div>
                </ModalBody>
                <ModalFooter>
                    <div className="flex gap-2">
                        <Button color="gray" onClick={onClose} disabled={loading}>Cancelar</Button>
                        <Button type="submit" disabled={loading}>{loading ? 'Salvando...' : 'Criar'}</Button>
                    </div>
                </ModalFooter>
            </form>
        </Modal>
    );
}
