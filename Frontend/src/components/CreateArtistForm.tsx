import { Button, Modal, TextInput } from "flowbite-react";
import { useState } from "react";
import { artistsService } from "../services/artistsService";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onCreated?: () => void;
}

export default function CreateArtistForm({ isOpen, onClose, onCreated }: Props) {
    const [nome, setNome] = useState("");
    const [genero, setGenero] = useState("");
    const [imageUrl, setImageUrl] = useState("");
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
            await artistsService.create({ nome: nome.trim(), genero: genero.trim() || undefined, imageUrl: imageUrl.trim() || undefined });
            onCreated?.();
            onClose();
            setNome("");
            setGenero("");
            setImageUrl("");
        } catch (err: any) {
            setError(err?.response?.data?.error || err?.response?.data || err?.message || "Erro ao criar artista");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal show={isOpen} size="md" onClose={onClose}>
            <form onSubmit={submit}>
                <Modal.Header> Criar artista </Modal.Header>
                <Modal.Body>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="artist-nome" className="block text-sm font-medium text-gray-700">Nome</label>
                            <TextInput id="artist-nome" value={nome} onChange={(e) => setNome((e.target as HTMLInputElement).value)} />
                        </div>

                        <div>
                            <label htmlFor="artist-genero" className="block text-sm font-medium text-gray-700">Gênero</label>
                            <TextInput id="artist-genero" value={genero} onChange={(e) => setGenero((e.target as HTMLInputElement).value)} />
                        </div>

                        <div>
                            <label htmlFor="artist-imageUrl" className="block text-sm font-medium text-gray-700">Image URL</label>
                            <TextInput id="artist-imageUrl" value={imageUrl} onChange={(e) => setImageUrl((e.target as HTMLInputElement).value)} />
                        </div>

                        {error && <div className="text-sm text-red-600">{String(error)}</div>}
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <div className="flex gap-2">
                        <Button color="gray" onClick={onClose} disabled={loading}>Cancelar</Button>
                        <Button type="submit" disabled={loading}>{loading ? 'Salvando...' : 'Criar'}</Button>
                    </div>
                </Modal.Footer>
            </form>
        </Modal>
    );
}
