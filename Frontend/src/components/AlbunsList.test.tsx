import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AlbunsList from '../components/AlbunsList';
import { useAlbuns } from '../hooks/useAlbuns';

// Mock the hook
vi.mock('../hooks/useAlbuns');
vi.mock('./CreateAlbumForm', () => ({
  default: () => <div data-testid="mock-create-album-form" />
}));

describe('AlbunsList', () => {
  const defaultMock = {
    albuns: [],
    loading: false,
    error: null,
    page: 0,
    totalPages: 10,
    first: true,
    last: false,
    setPage: vi.fn()
  };

  it.skip('should show loading spinner when loading', () => {
    (useAlbuns as any).mockReturnValue({
      ...defaultMock,
      loading: true
    });

    render(<AlbunsList />);

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should show error message when there is an error', () => {
    (useAlbuns as any).mockReturnValue({
      ...defaultMock,
      error: 'Failed to load albums'
    });

    render(<AlbunsList />);

    expect(screen.getByText('Failed to load albums')).toBeInTheDocument();
  });

  it('should show empty message when no albums', () => {
    (useAlbuns as any).mockReturnValue({
      ...defaultMock,
      albuns: []
    });

    render(<AlbunsList />);

    expect(screen.getByText('Nenhum álbum encontrado.')).toBeInTheDocument();
  });

  it('should render album cards when albums exist', () => {
    const mockAlbuns = [
      { id: 1, titulo: 'Album 1', ano: 2020 },
      { id: 2, titulo: 'Album 2', ano: 2021 }
    ];

    (useAlbuns as any).mockReturnValue({
      ...defaultMock,
      albuns: mockAlbuns
    });

    render(<AlbunsList />);

    expect(screen.getByText('Álbuns')).toBeInTheDocument();
    expect(screen.getByText('Album 1')).toBeInTheDocument();
    expect(screen.getByText('Album 2')).toBeInTheDocument();
  });

  it('should enable/disable pagination buttons correctly', () => {
    const mockAlbuns = [{ id: 1, titulo: 'A', ano: 2020 }];

    // First page
    (useAlbuns as any).mockReturnValue({
      ...defaultMock,
      albuns: mockAlbuns,
      page: 0,
      totalPages: 5,
      first: true,
      last: false
    });

    const { rerender } = render(<AlbunsList />);

    // Flowbite Pagination uses buttons with aria-labels
    const prevButton = screen.getByRole('button', { name: /anterior/i });
    const nextButton = screen.getByRole('button', { name: /próxima/i });

    expect(prevButton).toHaveAttribute('disabled');
    expect(nextButton).not.toHaveAttribute('disabled');

    // Last page
    (useAlbuns as any).mockReturnValue({
      ...defaultMock,
      albuns: mockAlbuns,
      page: 4,
      totalPages: 5,
      first: false,
      last: true
    });

    rerender(<AlbunsList />);
    const prevButtonRerendered = screen.getByRole('button', { name: /anterior/i });
    const nextButtonRerendered = screen.getByRole('button', { name: /próxima/i });

    expect(prevButtonRerendered).not.toHaveAttribute('disabled');
    expect(nextButtonRerendered).toHaveAttribute('disabled');
  });

  it('should call setPage when pagination buttons are clicked', () => {
    const mockSetPage = vi.fn();
    const mockAlbuns = [{ id: 1, titulo: 'A', ano: 2020 }];

    (useAlbuns as any).mockReturnValue({
      ...defaultMock,
      albuns: mockAlbuns,
      page: 1,
      totalPages: 5,
      first: false,
      last: false,
      setPage: mockSetPage
    });

    render(<AlbunsList />);

    const prevButton = screen.getByText('Anterior');
    const nextButton = screen.getByText('Próxima');

    fireEvent.click(prevButton);
    expect(mockSetPage).toHaveBeenCalledWith(0);

    fireEvent.click(nextButton);
    expect(mockSetPage).toHaveBeenCalledWith(2);
  });
});