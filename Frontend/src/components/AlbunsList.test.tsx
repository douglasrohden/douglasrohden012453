import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import AlbunsList from '../components/AlbunsList';
import { useAlbuns } from '../hooks/useAlbuns';

// Mock the hook
vi.mock('../hooks/useAlbuns');

describe('AlbunsList', () => {
  it('should show loading spinner when loading', () => {
    (useAlbuns as any).mockReturnValue({
      albuns: [],
      loading: true,
      error: null
    });

    render(<AlbunsList />);

    expect(screen.getByText('', { selector: '.animate-spin' })).toBeInTheDocument();
  });

  it('should show error message when there is an error', () => {
    (useAlbuns as any).mockReturnValue({
      albuns: [],
      loading: false,
      error: 'Failed to load albums'
    });

    render(<AlbunsList />);

    expect(screen.getByText('Failed to load albums')).toBeInTheDocument();
  });

  it('should show empty message when no albums', () => {
    (useAlbuns as any).mockReturnValue({
      albuns: [],
      loading: false,
      error: null
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
      albuns: mockAlbuns,
      loading: false,
      error: null
    });

    render(<AlbunsList />);

    expect(screen.getByText('Álbuns')).toBeInTheDocument();
    expect(screen.getByText('Album 1')).toBeInTheDocument();
    expect(screen.getByText('Album 2')).toBeInTheDocument();
  });

  it('should render correct number of album cards', () => {
    const mockAlbuns = [
      { id: 1, titulo: 'Album 1', ano: 2020 },
      { id: 2, titulo: 'Album 2', ano: 2021 },
      { id: 3, titulo: 'Album 3', ano: 2022 }
    ];

    (useAlbuns as any).mockReturnValue({
      albuns: mockAlbuns,
      loading: false,
      error: null
    });

    render(<AlbunsList />);

    const albumCards = screen.getAllByText(/Album \d/);
    expect(albumCards).toHaveLength(3);
  });
});