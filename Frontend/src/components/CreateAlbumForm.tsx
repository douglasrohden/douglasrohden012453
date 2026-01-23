import { useState, useEffect } from 'react';
import { Button, Label, TextInput, Modal, ModalBody, ModalHeader, ModalFooter } from 'flowbite-react';
import { useToast } from '../contexts/ToastContext';
import { artistsService, Artista } from '../services/artistsService';
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
        onChange(artist.nome);
        setArtistSearch(artist.nome);
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
    const [imageUrl, setImageUrl] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Artist selection state
    const [selectedArtist, setSelectedArtist] = useState<Artista | null>(null);
    const [artistSearch, setArtistSearch] = useState('');

    // Reset form when modal opens/closes
    useEffect(() => {
        if (show) {
            setTitulo('');
            setAno('');
            setImageUrl('');
            setError(null);
            setArtistSearch('');
            // If artistId is provided via props, we don't need to select one, 
            // but we don't necessarily have the full Artista object here. 
            // We'll rely on the prop for submission if present.
            if (!artistId) {
                setSelectedArtist(null);
            }
        }
    }, [show, artistId]);

    const handleArtistSearchChange = (value: string) => {
        setArtistSearch(value);
        if (selectedArtist) setSelectedArtist(null);
    };

    const selectArtist = (artist: Artista) => {
        setSelectedArtist(artist);
        setArtistSearch(artist.nome);
    };

    const handleTitleChange = (value: string) => {
        setTitulo(value);
    };

    const handleYearChange = (value: string) => {
        setAno(value);
    };

    const handleImageUrlChange = (value: string) => {
        setImageUrl(value);
    };

    const handleSave = async () => {
        setError(null);

        const targetArtistId = artistId || selectedArtist?.id;

        if (!targetArtistId) {
            setError('Selecione um artista');
            return;
        }

        const trimmedTitulo = titulo.trim();
        const trimmedImageUrl = imageUrl.trim();

        if (!trimmedTitulo) {
            setError('Título é obrigatório');
            return;
        }

        if (trimmedTitulo.length > 255) {
            setError('Título deve ter no máximo 255 caracteres');
            return;
        }

        if (trimmedImageUrl.length > 255) {
            setError('URL da capa deve ter no máximo 255 caracteres');
            return;
        }

        const anoValue = ano.trim() ? Number(ano) : undefined;
        if (ano.trim() && Number.isNaN(anoValue)) {
            setError('Ano inválido');
            return;
        }

        setIsSubmitting(true);
        try {
            await artistsService.addAlbum(targetArtistId, {
                titulo: trimmedTitulo,
                ano: anoValue,
                imageUrl: trimmedImageUrl || undefined,
            });
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
                            <ArtistSelector
                                value={artistSearch}
                                onChange={handleArtistSearchChange}
                                onSelect={selectArtist}
                                hasError={error === 'Selecione um artista'}
                            />
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
                                <Label htmlFor="imageUrl">URL da Capa</Label>
                            </div>
                            <TextInput
                                id="imageUrl"
                                placeholder="https://exemplo.com/capa.jpg"
                                value={imageUrl}
                                onChange={(e) => handleImageUrlChange(e.target.value)}
                            />
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
                            {isSubmitting ? 'Salvando...' : 'Salvar'}
                        </Button>
                    </div>
                </ModalFooter>
            </form>
        </Modal>
    );
}
