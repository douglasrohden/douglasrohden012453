import React, { useState, useEffect, useRef } from 'react';
import { Button, Label, TextInput, Modal, ModalBody, ModalHeader, ModalFooter, Spinner } from 'flowbite-react';
import { useToast } from '../contexts/ToastContext';
import { artistsService, Artista } from '../services/artistsService';
import { getErrorMessage } from '../api/client';
import { useArtists } from '../hooks/useArtists';

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
    const [isSearchingArtist, setIsSearchingArtist] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    // Use useArtists for searching
    const {
        artists: searchResults,
        loading: searchLoading,
        search: artistSearch,
        setSearch: setArtistSearch,
        setPage: setArtistPage
    } = useArtists();

    // Reset form when modal opens/closes
    useEffect(() => {
        if (show) {
            setTitulo('');
            setAno('');
            setImageUrl('');
            setError(null);
            setArtistSearch('');
            setIsSearchingArtist(false);
            // If artistId is provided via props, we don't need to select one, 
            // but we don't necessarily have the full Artista object here. 
            // We'll rely on the prop for submission if present.
            if (!artistId) {
                setSelectedArtist(null);
            }
        }
    }, [show, artistId, setArtistSearch]);

    // Handle clicking outside search results
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsSearchingArtist(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleArtistSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setArtistSearch(e.target.value);
        setIsSearchingArtist(true);
        setArtistPage(0); // Reset to first page of results
        if (selectedArtist) {
            setSelectedArtist(null); // Clear selection if user types again
        }
    };

    const selectArtist = (artist: Artista) => {
        setSelectedArtist(artist);
        setArtistSearch(artist.nome);
        setIsSearchingArtist(false);
    };

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
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
            addToast(message, 'error');
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal show={show} onClose={onClose} size="md">
            <form onSubmit={onSubmit}>
                <ModalHeader>Adicionar Álbum</ModalHeader>
                <ModalBody>
                    <div className="flex flex-col gap-4">
                        {/* Artist Selection Field - Only show if artistId prop is missing */}
                        {!artistId && (
                            <div className="relative" ref={searchRef}>
                                <div className="mb-2 block">
                                    <Label htmlFor="artist-search">Artista</Label>
                                </div>
                                <TextInput
                                    id="artist-search"
                                    placeholder="Buscar artista..."
                                    value={artistSearch}
                                    onChange={handleArtistSearchChange}
                                    onFocus={() => setIsSearchingArtist(true)}
                                    autoComplete="off"
                                    color={error === 'Selecione um artista' ? 'failure' : 'gray'}
                                />
                                {isSearchingArtist && (
                                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 rounded-md shadow-lg max-h-60 overflow-y-auto border border-gray-200 dark:border-gray-600">
                                        {searchLoading ? (
                                            <div className="p-4 text-center text-sm text-gray-500">
                                                <Spinner size="sm" /> Carregando...
                                            </div>
                                        ) : searchResults.length > 0 ? (
                                            <ul className="py-1">
                                                {searchResults.map((artist) => (
                                                    <li
                                                        key={artist.id}
                                                        onClick={() => selectArtist(artist)}
                                                        className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer"
                                                    >
                                                        {artist.nome}
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                                                Nenhum artista encontrado
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        <div>
                            <div className="mb-2 block">
                                <Label htmlFor="titulo">Título do Álbum</Label>
                            </div>
                            <TextInput
                                id="titulo"
                                placeholder="Ex: Hybrid Theory"
                                value={titulo}
                                onChange={(e) => setTitulo((e.target as HTMLInputElement).value)}
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
                                onChange={(e) => setAno((e.target as HTMLInputElement).value)}
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
                                onChange={(e) => setImageUrl((e.target as HTMLInputElement).value)}
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
