import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CreateAlbumForm from './CreateAlbumForm';
import { artistsService } from '../services/artistsService';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ToastProvider } from '../contexts/ToastContext';
import { useArtists } from '../hooks/useArtists';
import { uploadAlbumCovers } from '../services/albunsService';

vi.mock('../services/artistsService', () => ({
    artistsService: {
        addAlbum: vi.fn(),
    },
}));

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
    uploadAlbumCovers: vi.fn(),
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
        (uploadAlbumCovers as any).mockResolvedValue([]);
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
        expect(artistsService.addAlbum).not.toHaveBeenCalled();
    });

    it('envia com artista do contexto', async () => {
        const user = userEvent.setup();
        (artistsService.addAlbum as any).mockResolvedValue({ id: artistId, albuns: [{ id: 10, titulo: 'X' }] });
        renderComponent({ artistId });

        await user.type(screen.getByLabelText(/Título do Álbum/i), 'Novo Álbum');
        await user.type(screen.getByLabelText(/Ano de Lançamento/i), '2023');
        await user.click(screen.getByText('Salvar'));

        await waitFor(() => {
            expect(artistsService.addAlbum).toHaveBeenCalledWith(artistId, { titulo: 'Novo Álbum', ano: 2023 });
            expect(uploadAlbumCovers).not.toHaveBeenCalled(); // sem arquivos
            expect(mockOnSuccess).toHaveBeenCalled();
            expect(mockOnClose).toHaveBeenCalled();
        });
    });
});
