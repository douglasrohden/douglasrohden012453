import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CreateAlbumForm from './CreateAlbumForm';
import { artistsService } from '../services/artistsService';
import * as albunsService from '../services/albunsService';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ToastProvider } from '../contexts/ToastContext';
import { useArtists } from '../hooks/useArtists';
import { uploadAlbumImages } from '../services/albunsService';

// artistsService is used by the search hook; we don't need to mock addAlbum anymore

const mockSetSearch = vi.fn();
const mockSetPage = vi.fn();
vi.mock('../hooks/useArtists', () => ({
    useArtists: vi.fn(() => ({
        artists: [],
        loading: false,
        search: '',
        setSearch: mockSetSearch,
        setPage: mockSetPage,
    })),
}));

vi.mock('../services/albunsService', () => ({
    uploadAlbumImages: vi.fn(),
    createAlbum: vi.fn(),
}));

describe('CreateAlbumForm', () => {
    const mockOnSuccess = vi.fn();
    const mockOnClose = vi.fn();
    const artistId = 1;

    beforeEach(() => {
        vi.clearAllMocks();
        (useArtists as any).mockImplementation(() => ({
            artists: [],
            loading: false,
            search: '',
            setSearch: mockSetSearch,
            setPage: mockSetPage,
        }));
        (uploadAlbumImages as any).mockResolvedValue([]);
        (albunsService.createAlbum as any).mockResolvedValue({ id: 10, titulo: 'X' });
    });

    const renderComponent = (props: any = {}) => render(
        <ToastProvider>
            <CreateAlbumForm onSuccess={mockOnSuccess} onClose={mockOnClose} show={true} {...props} />
        </ToastProvider>
    );

    it('valida obrigatórios', async () => {
        const user = userEvent.setup();
        renderComponent({ artistId });
        await user.click(screen.getByText('Salvar'));
        await waitFor(() => expect(screen.getByText('Título é obrigatório')).toBeInTheDocument());
        expect(albunsService.createAlbum).not.toHaveBeenCalled();
    });

    it('envia com artista do contexto', async () => {
        const user = userEvent.setup();
        (albunsService.createAlbum as any).mockResolvedValue({ id: 10, titulo: 'X' });
        renderComponent({ artistId });

        await user.type(screen.getByLabelText(/Título do Álbum/i), 'Novo Álbum');
        await user.type(screen.getByLabelText(/Ano de Lançamento/i), '2023');
        await user.click(screen.getByText('Salvar'));

        await waitFor(() => {
            expect(albunsService.createAlbum).toHaveBeenCalledWith({ titulo: 'Novo Álbum', ano: 2023, artistaIds: [artistId] });
            expect(uploadAlbumImages).not.toHaveBeenCalled(); // sem arquivos
            expect(mockOnSuccess).toHaveBeenCalled();
            expect(mockOnClose).toHaveBeenCalled();
        });
    });
});
