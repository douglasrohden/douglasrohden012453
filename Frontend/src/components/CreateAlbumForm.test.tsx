
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CreateAlbumForm from './CreateAlbumForm';
import { artistsService } from '../services/artistsService';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ToastProvider } from '../contexts/ToastContext';


// Mock artistsService
vi.mock('../services/artistsService', () => ({
    artistsService: {
        addAlbum: vi.fn(),
    },
}));

// Mock flowbite-react (keep existing mock)
vi.mock('flowbite-react', () => {
    const ModalHeader = ({ children }: any) => <div>{children}</div>;
    const ModalBody = ({ children }: any) => <div>{children}</div>;
    const ModalFooter = ({ children }: any) => <div>{children}</div>;
    const Label = ({ htmlFor, value, children, ...props }: any) => <label htmlFor={htmlFor} {...props}>{children || value}</label>;

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
        TextInput: ({ value, onChange, ...props }: any) => (
            <input value={value} onChange={onChange} {...props} />
        ),
    };
});

describe('CreateAlbumForm', () => {
    const mockOnSuccess = vi.fn();
    const mockOnClose = vi.fn();
    const artistId = 1;

    beforeEach(() => {
        vi.clearAllMocks();
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

    it('renders correctly', () => {
        renderComponent({ artistId });
        expect(screen.getByText('Adicionar Álbum')).toBeInTheDocument();
        expect(screen.getByLabelText(/Título do Álbum/i)).toBeInTheDocument();
    });

    it('validates required fields', async () => {
        renderComponent({ artistId });
        const submitBtn = screen.getByText('Salvar');
        fireEvent.click(submitBtn);

        await waitFor(() => {
            expect(screen.getByText('Título é obrigatório')).toBeInTheDocument();
        });
        expect(artistsService.addAlbum).not.toHaveBeenCalled();
    });

    it('submits form with valid data (Artist Context)', async () => {
        renderComponent({ artistId });

        fireEvent.change(screen.getByLabelText(/Título do Álbum/i), { target: { value: 'Novo Álbum' } });
        fireEvent.change(screen.getByLabelText(/Ano de Lançamento/i), { target: { value: '2023' } });

        fireEvent.click(screen.getByText('Salvar'));

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
        (artistsService.addAlbum as any).mockRejectedValue(new Error('Failed'));
        renderComponent({ artistId });

        fireEvent.change(screen.getByLabelText(/Título do Álbum/i), { target: { value: 'Novo Álbum' } });
        fireEvent.click(screen.getByText('Salvar'));

        await waitFor(() => {
            expect(artistsService.addAlbum).toHaveBeenCalled();
            expect(mockOnSuccess).not.toHaveBeenCalled();
            expect(mockOnClose).not.toHaveBeenCalled();
        });
    });
});
