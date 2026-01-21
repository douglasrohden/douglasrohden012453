import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CreateArtistForm from '../components/CreateArtistForm';
import { artistsService } from '../services/artistsService';

// Mock flowbite-react
vi.mock('flowbite-react', () => {
  const ModalHeader = ({ children }: any) => <div>{children}</div>;
  const ModalBody = ({ children }: any) => <div>{children}</div>;
  const ModalFooter = ({ children }: any) => <div>{children}</div>;

  return {
    Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
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

// Mock the service
vi.mock('../services/artistsService');

describe('CreateArtistForm', () => {
  const mockProps = {
    isOpen: true,
    onClose: vi.fn(),
    onCreated: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render form when open', () => {
    render(<CreateArtistForm {...mockProps} />);

    expect(screen.getByTestId('modal')).toBeInTheDocument();
    expect(screen.getByText('Criar artista')).toBeInTheDocument();
  });

  it('should not render when closed', () => {
    render(<CreateArtistForm {...mockProps} isOpen={false} />);

    expect(screen.queryByText('Criar artista')).not.toBeInTheDocument();
  });

  it('should validate required name field', async () => {
    const user = userEvent.setup();
    render(<CreateArtistForm {...mockProps} />);

    const submitButton = screen.getByRole('button', { name: 'Criar' });
    await user.click(submitButton);

    expect(screen.getByText('Nome é obrigatório')).toBeInTheDocument();
  });

  it('should submit form successfully', async () => {
    const user = userEvent.setup();
    (artistsService.create as any).mockResolvedValue({});

    render(<CreateArtistForm {...mockProps} />);

    const nameInput = screen.getByLabelText('Nome');
    const genreInput = screen.getByLabelText('Gênero');
    const imageInput = screen.getByLabelText('Image URL');
    const submitButton = screen.getByRole('button', { name: 'Criar' });

    await user.type(nameInput, 'Test Artist');
    await user.type(genreInput, 'Rock');
    await user.type(imageInput, 'http://example.com/image.jpg');
    await user.click(submitButton);

    await waitFor(() => {
      expect(artistsService.create).toHaveBeenCalledWith({
        nome: 'Test Artist',
        genero: 'Rock',
        imageUrl: 'http://example.com/image.jpg'
      });
      expect(mockProps.onCreated).toHaveBeenCalled();
      expect(mockProps.onClose).toHaveBeenCalled();
    });
  });

  it('should handle optional fields', async () => {
    const user = userEvent.setup();
    (artistsService.create as any).mockResolvedValue({});

    render(<CreateArtistForm {...mockProps} />);

    const nameInput = screen.getByLabelText('Nome');
    const submitButton = screen.getByRole('button', { name: 'Criar' });

    await user.type(nameInput, 'Test Artist');
    await user.click(submitButton);

    await waitFor(() => {
      expect(artistsService.create).toHaveBeenCalledWith({
        nome: 'Test Artist',
        genero: undefined,
        imageUrl: undefined
      });
    });
  });

  it('should handle submit error', async () => {
    const user = userEvent.setup();
    const error = new Error('Server error');
    (artistsService.create as any).mockRejectedValue(error);

    render(<CreateArtistForm {...mockProps} />);

    const nameInput = screen.getByLabelText('Nome');
    const submitButton = screen.getByRole('button', { name: 'Criar' });

    await user.type(nameInput, 'Test Artist');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Server error')).toBeInTheDocument();
    });
  });

  it('should disable buttons during loading', async () => {
    const user = userEvent.setup();
    (artistsService.create as any).mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<CreateArtistForm {...mockProps} />);

    const nameInput = screen.getByLabelText('Nome');
    const submitButton = screen.getByRole('button', { name: 'Criar' });
    const cancelButton = screen.getByRole('button', { name: 'Cancelar' });

    await user.type(nameInput, 'Test Artist');
    await user.click(submitButton);

    expect(submitButton).toBeDisabled();
    expect(cancelButton).toBeDisabled();
    expect(screen.getByText('Salvando...')).toBeInTheDocument();
  });

  it('should clear form on successful submit', async () => {
    const user = userEvent.setup();
    (artistsService.create as any).mockResolvedValue({});

    render(<CreateArtistForm {...mockProps} />);

    const nameInput = screen.getByLabelText('Nome');
    const genreInput = screen.getByLabelText('Gênero');
    const imageInput = screen.getByLabelText('Image URL');
    const submitButton = screen.getByRole('button', { name: 'Criar' });

    await user.type(nameInput, 'Test Artist');
    await user.type(genreInput, 'Rock');
    await user.type(imageInput, 'http://example.com/image.jpg');
    await user.click(submitButton);

    await waitFor(() => {
      expect(nameInput).toHaveValue('');
      expect(genreInput).toHaveValue('');
      expect(imageInput).toHaveValue('');
    });
  });

  it('should call onClose when cancel is clicked', async () => {
    const user = userEvent.setup();
    render(<CreateArtistForm {...mockProps} />);

    const cancelButton = screen.getByRole('button', { name: 'Cancelar' });
    await user.click(cancelButton);

    expect(mockProps.onClose).toHaveBeenCalled();
  });
});