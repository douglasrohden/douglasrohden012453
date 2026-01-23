import { describe, it, expect, vi, beforeEach } from 'vitest';
import { artistasFacade } from './artistas.facade';
import { artistsService } from '../services/artistsService';

vi.mock('../services/artistsService', () => {
  return {
    artistsService: {
      getAll: vi.fn(),
    },
  };
});

describe('ArtistasFacade', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    artistasFacade.clearError();
  });

  it('calls artistsService.getAll with correct parameters', async () => {
    (artistsService.getAll as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      content: [],
      totalPages: 0,
      totalElements: 0,
      last: true,
      size: 10,
      number: 0,
      sort: { empty: true, sorted: false, unsorted: true },
      numberOfElements: 0,
      first: true,
      empty: true,
    });

    await artistasFacade.fetch({ page: 2, size: 5, search: 'abc', dir: 'desc', tipo: 'BANDA' });

    expect(artistsService.getAll).toHaveBeenCalledWith(2, 5, 'abc', 'nome', 'desc', 'BANDA');
  });
});
