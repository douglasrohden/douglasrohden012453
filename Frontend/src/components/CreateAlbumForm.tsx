import { useState, useEffect } from 'react';
import { Button, Label, TextInput, Modal, ModalBody, ModalHeader, ModalFooter, FileInput, Spinner } from 'flowbite-react';
import { useToast } from '../contexts/ToastContext';
import { Artista } from '../services/artistsService';
import { createAlbum, uploadAlbumImages } from '../services/albunsService';
import { getErrorMessage } from '../api/client';
import { useArtists } from '../hooks/useArtists';
import ArtistSearchInput from './common/ArtistSearchInput';
import axios from 'axios';

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
        onChange('');
        setArtistSearch('');
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

export default function CreateAlbumForm({ artistId, onSuccess, onClose, show }: CreateAlbumFormProps) {
    const { addToast } = useToast();
    const [titulo, setTitulo] = useState('');
    const [ano, setAno] = useState('');
    const [files, setFiles] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Artist selection state (multiple)
    const [selectedArtists, setSelectedArtists] = useState<Artista[]>([]);
    const [artistSearch, setArtistSearch] = useState('');

    // Reset form when modal opens/closes
    useEffect(() => {
        if (show) {
            setTitulo('');
            setAno('');
            setFiles([]);
            setPreviews([]);
            setError(null);
            setArtistSearch('');
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
        setArtistSearch('');
    };

    const removeArtist = (id: number) => {
        setSelectedArtists((prev) => prev.filter((a) => a.id !== id));
    };

    const handleTitleChange = (value: string) => {
        setTitulo(value);
    };

    const handleYearChange = (value: string) => {
        setAno(value);
    };

    const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5MB por arquivo
    const MAX_TOTAL_BYTES = 25 * 1024 * 1024; // 25MB por requisição

    const handleFilesChange = (fileList: FileList | null) => {
        if (!fileList) {
            setFiles([]);
            setPreviews([]);
            return;
        }
        const filesArray = Array.from(fileList);

        const tooBig = filesArray.some((f) => f.size > MAX_FILE_BYTES);
        const totalTooBig = filesArray.reduce((acc, f) => acc + f.size, 0) > MAX_TOTAL_BYTES;
        if (tooBig) {
            setError('Cada arquivo deve ter no máximo 5MB');
            return;
        }
        if (totalTooBig) {
            setError('Tamanho total ultrapassa 25MB');
            return;
        }

        setError(null);
        setFiles(filesArray);
        setPreviews(filesArray.map((f) => URL.createObjectURL(f)));
    };

    const handleSave = async () => {
        setError(null);

        const targetArtistIds = artistId ? [artistId] : selectedArtists.map((a) => a.id);

        if (!targetArtistIds || targetArtistIds.length === 0) {
            setError('Selecione pelo menos um artista');
            return;
        }

        const trimmedTitulo = titulo.trim();
        if (!trimmedTitulo) {
            setError('Título é obrigatório');
            return;
        }

        if (trimmedTitulo.length > 255) {
            setError('Título deve ter no máximo 255 caracteres');
            return;
        }

        const anoValue = ano.trim() ? Number(ano) : undefined;
        if (ano.trim() && Number.isNaN(anoValue)) {
            setError('Ano inválido');
            return;
        }

        setIsSubmitting(true);
        try {
            const album = await createAlbum({
                titulo: trimmedTitulo,
                ano: anoValue,
                artistaIds: targetArtistIds,
            });

            const albumId = album?.id;

            if (files.length > 0) {
                if (!albumId) {
                    throw new Error('Não foi possível obter o id do álbum para subir as capas.');
                }
                await uploadAlbumImages(albumId, files);
            }
            addToast('Álbum adicionado com sucesso!', 'success');
            onSuccess();
            onClose();
        } catch (err) {
            const message = getErrorMessage(err, 'Erro ao adicionar álbum.');
            setError(message);
            const status = axios.isAxiosError(err) ? err.response?.status : undefined;
            // 429 already triggers a global warning toast
            if (status !== 429) addToast(message, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal show={show} onClose={onClose} size="md">
            <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
                <ModalHeader>Adicionar Álbum</ModalHeader>
                <ModalBody>
                    <div className="flex flex-col gap-4">
                        {/* Artist Selection Field - Only show if artistId prop is missing */}
                        {!artistId && (
                            <div>
                                <ArtistSelector
                                    value={artistSearch}
                                    onChange={handleArtistSearchChange}
                                    onSelect={selectArtist}
                                    hasError={error === 'Selecione pelo menos um artista'}
                                />
                                {selectedArtists.length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {selectedArtists.map((a) => (
                                            <div key={a.id} className="px-2 py-1 bg-gray-200 rounded flex items-center gap-2">
                                                <span className="text-sm">{a.nome}</span>
                                                <button type="button" onClick={() => removeArtist(a.id)} className="text-sm text-red-600">×</button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                        {artistId && (
                            <div className="text-sm text-gray-600">Vinculado ao artista selecionado.</div>
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
                                color={error?.toLowerCase().includes('título') ? 'failure' : 'gray'}
                            />
                        </div>
                        <div>
                            <div className="mb-2 block">
                                <Label htmlFor="ano">Ano de Lançamento</Label>
                            </div>
                            <TextInput
                                id="ano"
                                type="number"
                                placeholder="Ex: 2000"
                                value={ano}
                                onChange={(e) => handleYearChange(e.target.value)}
                            />
                        </div>
                        <div>
                            <div className="mb-2 block">
                                <Label htmlFor="capas">Capas do Álbum (múltiplas, 5MB máx cada, 25MB total)</Label>
                            </div>
                            <FileInput
                                id="capas"
                                multiple
                                accept="image/*"
                                onChange={(e) => handleFilesChange(e.target.files)}
                            />
                            {previews.length > 0 && (
                                <div className="mt-2 grid grid-cols-3 gap-2">
                                    {previews.map((src, idx) => (
                                        <img key={idx} src={src} alt={`preview-${idx}`} className="h-24 w-full object-cover rounded" />
                                    ))}
                                </div>
                            )}
                        </div>
                        {error && <div className="text-sm text-red-600">{String(error)}</div>}
                    </div>
                </ModalBody>
                <ModalFooter>
                    <div className="flex gap-2">
                        <Button color="gray" onClick={onClose} disabled={isSubmitting}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <span className="flex items-center gap-2"><Spinner size="sm" /> Salvando...</span>
                            ) : 'Salvar'}
                        </Button>
                    </div>
                </ModalFooter>
            </form>
        </Modal>
    );
}
