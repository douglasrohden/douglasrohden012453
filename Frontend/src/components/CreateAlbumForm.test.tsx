import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CreateAlbumForm from './CreateAlbumForm';
import { artistsService } from '../services/artistsService';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ToastProvider } from '../contexts/ToastContext';
import { useArtists } from '../hooks/useArtists';

// Mock artistsService
vi.mock('../services/artistsService', () => ({
    artistsService: {
        addAlbum: vi.fn(),
    },
}));

// Mock useArtists
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

// Mock flowbite-react (keep existing mock)
vi.mock('flowbite-react', () => {
    const ModalHeader = ({ children }: any) => <div>{children}</div>;
    const ModalBody = ({ children }: any) => <div>{children}</div>;
    const ModalFooter = ({ children }: any) => <div>{children}</div>;
    const Label = ({ htmlFor, value, children, ...props }: any) => <label htmlFor={htmlFor} {...props}>{children || value}</label>;
    const Spinner = () => <div>Loading...</div>;

    return {
        Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
        Label,
        Modal: Object.assign(
            ({ children, show }: any) => (show ? <div data-testid="modal">{children}</div> : null),
            {
                Header: ModalHeader,
                Body: ModalBody,
                Footer: ModalFooter,
            },
        ),
        ModalHeader,
        ModalBody,
        ModalFooter,
        TextInput: ({ value, onChange, onFocus, ...props }: any) => (
            <input value={value} onChange={onChange} onFocus={onFocus} {...props} />
        ),
        Spinner,
    };
});

describe('CreateAlbumForm', () => {
    const mockOnSuccess = vi.fn();
    const mockOnClose = vi.fn();
    const artistId = 1;

    beforeEach(() => {
        vi.clearAllMocks();
        // Reset default mock implementation for useArtists
        (useArtists as any).mockImplementation(() => ({
            artists: [],
            loading: false,
            search: '',
            setSearch: mockSetSearch,
            setPage: mockSetPage,
        }));
    });

    const renderComponent = (props: any = {}) => {
        return render(
            <ToastProvider>
                <CreateAlbumForm
                    onSuccess={mockOnSuccess}
                    onClose={mockOnClose}
                    show={true}
                    {...props}
                />
            </ToastProvider>
        );
    };

    it('renders correctly with artistId', () => {
        renderComponent({ artistId });
        expect(screen.getByText('Adicionar Álbum')).toBeInTheDocument();
        expect(screen.getByLabelText(/Título do Álbum/i)).toBeInTheDocument();
        expect(screen.queryByLabelText(/Artista/i)).not.toBeInTheDocument();
    });

    it('renders correctly without artistId (show selection)', () => {
        renderComponent({}); // No artistId
        expect(screen.getByText('Adicionar Álbum')).toBeInTheDocument();
        expect(screen.getByLabelText(/Artista/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Título do Álbum/i)).toBeInTheDocument();
    });

    it('validates required fields', async () => {
        const user = userEvent.setup();
        renderComponent({ artistId });
        const submitBtn = screen.getByText('Salvar');
        await user.click(submitBtn);

        await waitFor(() => {
            expect(screen.getByText('Título é obrigatório')).toBeInTheDocument();
        });
        expect(artistsService.addAlbum).not.toHaveBeenCalled();
    });

    it('submits form with valid data (Artist Context)', async () => {
        const user = userEvent.setup();
        renderComponent({ artistId });

        const titleInput = screen.getByLabelText(/Título do Álbum/i);
        const yearInput = screen.getByLabelText(/Ano de Lançamento/i);

        await user.type(titleInput, 'Novo Álbum');
        await user.type(yearInput, '2023');

        await user.click(screen.getByText('Salvar'));

        await waitFor(() => {
            expect(artistsService.addAlbum).toHaveBeenCalledWith(artistId, {
                titulo: 'Novo Álbum',
                ano: 2023,
                imageUrl: undefined
            });
            expect(mockOnSuccess).toHaveBeenCalled();
            expect(mockOnClose).toHaveBeenCalled();
        });
    });

    it('handles submission error', async () => {
        const user = userEvent.setup();
        (artistsService.addAlbum as any).mockRejectedValue(new Error('Failed'));
        renderComponent({ artistId });

        await user.type(screen.getByLabelText(/Título do Álbum/i), 'Novo Álbum');
        await user.click(screen.getByText('Salvar'));

        await waitFor(() => {
            expect(artistsService.addAlbum).toHaveBeenCalled();
            expect(mockOnSuccess).not.toHaveBeenCalled();
            expect(mockOnClose).not.toHaveBeenCalled();
        });
    });

    it('selects an artist and submits (Global Context)', async () => {
        const user = userEvent.setup();
        const mockArtists = [
            { id: 10, nome: 'Linkin Park', genero: 'Rock', albuns: [] }
        ];

        // Override mock for this test
        (useArtists as any).mockReturnValue({
            artists: mockArtists,
            loading: false,
            search: 'Linkin', // Input will take this value
            setSearch: mockSetSearch,
            setPage: mockSetPage,
        });

        renderComponent({}); // No artistId

        // Verify search input
        const artistInput = screen.getByLabelText(/Artista/i);

        // Simulate typing
        await user.type(artistInput, 'Linkin');

        // Ensure setSearch was called (due to typing)
        expect(mockSetSearch).toHaveBeenCalled();

        // Use findByText to wait for the item to appear
        const artistOption = await screen.findByText('Linkin Park');
        expect(artistOption).toBeInTheDocument();

        // Select artist
        await user.click(artistOption);

        // Fill other fields
        await user.type(screen.getByLabelText(/Título do Álbum/i), 'Meteora');

        await user.click(screen.getByText('Salvar'));

        await waitFor(() => {
            expect(artistsService.addAlbum).toHaveBeenCalledWith(10, {
                titulo: 'Meteora',
                ano: undefined,
                imageUrl: undefined
            });
        });
    });
});
