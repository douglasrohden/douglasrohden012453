
import React, { useState } from 'react';
import { Button, Label, TextInput, Modal, ModalBody, ModalHeader, ModalFooter } from 'flowbite-react';
import { useToast } from '../contexts/ToastContext';
import { artistsService } from '../services/artistsService';
import { getErrorMessage } from '../api/client';

interface CreateAlbumFormProps {
    artistId: number;
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

    const resetForm = () => {
        setTitulo('');
        setAno('');
        setImageUrl('');
        setError(null);
    };

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

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
            await artistsService.addAlbum(artistId, {
                titulo: trimmedTitulo,
                ano: anoValue,
                imageUrl: trimmedImageUrl || undefined,
            });
            addToast('Álbum adicionado com sucesso!', 'success');
            resetForm();
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
