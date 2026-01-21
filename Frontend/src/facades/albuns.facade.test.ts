import { describe, it, expect, vi, beforeEach } from 'vitest';
import { albunsFacade } from '../facades/albuns.facade';
import { getAlbuns } from '../services/albunsService';

// Mock dependencies
vi.mock('../services/albunsService');

describe('AlbunsFacade', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetch', () => {
    it('should call getAlbuns with correct parameters', async () => {
      const mockData = { content: [] };
      (getAlbuns as any).mockResolvedValue(mockData);

      await albunsFacade.fetch(0, 10);

      expect(getAlbuns).toHaveBeenCalledWith(0, 10);
    });

    it('should handle fetch error', async () => {
      const error = new Error('Network error');
      (getAlbuns as any).mockRejectedValue(error);

      await albunsFacade.fetch();

      expect(albunsFacade.snapshot.error).toBe('Network error');
      expect(getAlbuns).toHaveBeenCalledWith(0, 10);
    });

    it('should use default parameters', async () => {
      const mockData = { content: [] };
      (getAlbuns as any).mockResolvedValue(mockData);

      await albunsFacade.fetch();

      expect(getAlbuns).toHaveBeenCalledWith(0, 10);
    });

    it('should use provided parameters', async () => {
      const mockData = { content: [] };
      (getAlbuns as any).mockResolvedValue(mockData);

      await albunsFacade.fetch(2, 50);

      expect(getAlbuns).toHaveBeenCalledWith(2, 50);
    });
  });
});