import { Button, Modal, ModalBody, ModalFooter, ModalHeader, TextInput, Select, Label, FileInput, Badge } from "flowbite-react";
import { useState } from "react";
import { artistsService, uploadArtistImages } from "../services/artistsService";
import { useToast } from "../contexts/ToastContext";
import { getErrorMessage } from "../api/client";
import axios from "axios";
import { Album } from "../services/albunsService";
import AlbumSearchInput from "./common/AlbumSearchInput";
import { useAlbums } from "../hooks/useAlbums";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onCreated?: () => void;
}

export default function CreateArtistForm({ isOpen, onClose, onCreated }: Props) {
    const { addToast } = useToast();
    const [nome, setNome] = useState("");
    const [genero, setGenero] = useState("");
    const [tipo, setTipo] = useState("CANTOR");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [files, setFiles] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const [selectedAlbums, setSelectedAlbums] = useState<Album[]>([]);
    const [albumSearch, setAlbumSearch] = useState("");
    const { albums, loading: albumsLoading } = useAlbums(albumSearch);

    const handleNameChange = (value: string) => {
        setNome(value);
    };

    const handleGeneroChange = (value: string) => {
        setGenero(value);
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
        const totalTooBig = combinedFiles.reduce((acc, f) => acc + f.size, 0) > MAX_TOTAL_BYTES;

        if (tooBig) {
            setError('Cada arquivo deve ter no máximo 5MB');
            return;
        }
        if (totalTooBig) {
            setError('Tamanho total ultrapassa 25MB');
            return;
        }

        setError(null);
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
        if (!selectedAlbums.find(a => a.id === album.id)) {
            setSelectedAlbums([...selectedAlbums, album]);
        }
        setAlbumSearch("");
    };

    const removeAlbum = (id: number) => {
        setSelectedAlbums(selectedAlbums.filter(a => a.id !== id));
    };


    const handleSave = async () => {
        setError(null);
        if (!nome.trim()) {
            setError("Nome é obrigatório");
            return;
        }
        setLoading(true);
        try {
            const artista = await artistsService.create({
                nome: nome.trim(),
                genero: genero.trim() || undefined,
                tipo: tipo,
                albumIds: selectedAlbums.map(a => a.id)
            });

            // Upload images if any
            if (files.length > 0 && artista.id) {
                await uploadArtistImages(artista.id, files);
            }

            addToast("Artista criado com sucesso!", "success");
            onCreated?.();
            onClose();
            setNome("");
            setGenero("");
            setTipo("CANTOR");
            setFiles([]);
            setPreviews([]);
            setSelectedAlbums([]);
            setAlbumSearch("");
        } catch (err) {
            const msg = getErrorMessage(err, "Erro ao criar artista");
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
            <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
                <ModalHeader> Criar artista </ModalHeader>
                <ModalBody>
                    <div className="space-y-4">
                        <div>
                            <div className="mb-2 block">
                                <Label htmlFor="artist-nome">Nome</Label>
                            </div>
                            <TextInput id="artist-nome" value={nome} onChange={(e) => handleNameChange(e.target.value)} />
                        </div>

                        <div>
                            <div className="mb-2 block">
                                <Label htmlFor="artist-genero">Gênero</Label>
                            </div>
                            <TextInput id="artist-genero" value={genero} onChange={(e) => handleGeneroChange(e.target.value)} />
                        </div>

                        <div>
                            <div className="mb-2 block">
                                <Label htmlFor="artist-tipo">Tipo</Label>
                            </div>
                            <Select id="artist-tipo" value={tipo} onChange={(e) => handleTipoChange(e.target.value)}>
                                <option value="CANTOR">Cantor</option>
                                <option value="BANDA">Banda</option>
                                <option value="DUPLA">Dupla</option>
                            </Select>
                        </div>

                        <div>
                            <AlbumSearchInput
                                value={albumSearch}
                                results={albums}
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
                                                {album.ano && <span className="text-xs">({album.ano})</span>}
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
                                <Label htmlFor="artist-images">Imagens do Artista (Adicionar múltiplas)</Label>
                            </div>
                            <div className="flex flex-col gap-2">
                                <FileInput
                                    id="artist-images"
                                    multiple
                                    accept="image/*"
                                    onChange={(e) => {
                                        handleFilesChange(e.target.files);
                                        e.target.value = '';
                                    }}
                                />
                                <span className="text-xs text-gray-500">
                                    Máx 5MB por arquivo, 25MB total. Selecione mais arquivos para adicionar à lista.
                                </span>
                            </div>
                            {previews.length > 0 && (
                                <div className="mt-2 grid grid-cols-3 gap-2">
                                    {previews.map((src, idx) => (
                                        <div key={idx} className="relative group">
                                            <img src={src} alt={`preview-${idx}`} className="h-24 w-full object-cover rounded border border-gray-200" />
                                            <button
                                                type="button"
                                                onClick={() => removeFile(idx)}
                                                className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                title="Remover imagem"
                                            >
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
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
