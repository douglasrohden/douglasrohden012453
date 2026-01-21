import { describe, it, expect, vi, beforeEach, Mocked } from 'vitest';
import { authFacade } from '../facades/auth.facade';
import { authStore } from '../store/auth.store';
import { authService } from '../services/authService';

// Mock dependencies
vi.mock('../store/auth.store');
vi.mock('../services/authService');

const mockAuthStore = authStore as Mocked<typeof authStore>;
const mockAuthService = authService as Mocked<typeof authService>;

describe('AuthFacade', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('authState$', () => {
    it('should return authStore state$', () => {
      const mockState$ = {};
      mockAuthStore.state$ = mockState$ as any;

      expect(authFacade.authState$).toBe(mockState$);
    });
  });

  describe('currentAuthState', () => {
    it('should return current auth state', () => {
      const mockState = { isAuthenticated: true, user: 'test' };
      mockAuthStore.currentState = mockState;

      expect(authFacade.currentAuthState).toBe(mockState);
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when authenticated', () => {
      mockAuthStore.currentState = { isAuthenticated: true };

      expect(authFacade.isAuthenticated).toBe(true);
    });

    it('should return false when not authenticated', () => {
      mockAuthStore.currentState = { isAuthenticated: false };

      expect(authFacade.isAuthenticated).toBe(false);
    });
  });

  describe('currentUser', () => {
    it('should return current user', () => {
      mockAuthStore.currentState = { user: 'testuser' };

      expect(authFacade.currentUser).toBe('testuser');
    });
  });

  describe('login', () => {
    it('should login successfully and update store', async () => {
      const mockResponse = {
        accessToken: 'token',
        refreshToken: 'refresh',
        expiresIn: 3600
      };
      mockAuthService.login.mockResolvedValue(mockResponse);
      mockAuthStore.setAuthenticated.mockImplementation(() => {});

      const result = await authFacade.login('user', 'pass');

      expect(result).toBe(mockResponse);
      expect(mockAuthService.login).toHaveBeenCalledWith('user', 'pass');
      expect(mockAuthStore.setAuthenticated).toHaveBeenCalledWith('token', 'refresh', 'user');
    });

    it('should clear auth on login failure', async () => {
      const error = new Error('Login failed');
      mockAuthService.login.mockRejectedValue(error);
      mockAuthStore.clearAuthentication.mockImplementation(() => {});

      await expect(authFacade.login('user', 'pass')).rejects.toThrow('Login failed');
      expect(mockAuthStore.clearAuthentication).toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('should clear authentication and redirect', () => {
      const mockLocation = { href: '' };
      Object.defineProperty(window, 'location', {
        value: mockLocation,
        writable: true
      });
      mockAuthStore.clearAuthentication.mockImplementation(() => {});

      authFacade.logout();

      expect(mockAuthStore.clearAuthentication).toHaveBeenCalled();
      expect(window.location.href).toBe('/login');
    });
  });

  describe('getAccessToken', () => {
    it('should return access token', () => {
      mockAuthStore.currentState = { accessToken: 'token' };

      expect(authFacade.getAccessToken()).toBe('token');
    });
  });

  describe('getRefreshToken', () => {
    it('should return refresh token', () => {
      mockAuthStore.currentState = { refreshToken: 'refresh' };

      expect(authFacade.getRefreshToken()).toBe('refresh');
    });
  });

  describe('updateTokens', () => {
    it('should update tokens with provided username', () => {
      mockAuthStore.currentState = { user: 'olduser' };
      mockAuthStore.setAuthenticated.mockImplementation(() => {});

      authFacade.updateTokens('newtoken', 'newrefresh', 'newuser');

      expect(mockAuthStore.setAuthenticated).toHaveBeenCalledWith('newtoken', 'newrefresh', 'newuser');
    });

    it('should use current user if no username provided', () => {
      mockAuthStore.currentState = { user: 'currentuser' };
      mockAuthStore.setAuthenticated.mockImplementation(() => {});

      authFacade.updateTokens('newtoken', 'newrefresh');

      expect(mockAuthStore.setAuthenticated).toHaveBeenCalledWith('newtoken', 'newrefresh', 'currentuser');
    });
  });

  describe('hasValidTokens', () => {
    it('should return true when both tokens exist', () => {
      mockAuthStore.currentState = { accessToken: 'token', refreshToken: 'refresh' };

      expect(authFacade.hasValidTokens()).toBe(true);
    });

    it('should return false when access token is missing', () => {
      mockAuthStore.currentState = { accessToken: null, refreshToken: 'refresh' };

      expect(authFacade.hasValidTokens()).toBe(false);
    });

    it('should return false when refresh token is missing', () => {
      mockAuthStore.currentState = { accessToken: 'token', refreshToken: null };

      expect(authFacade.hasValidTokens()).toBe(false);
    });
  });
});