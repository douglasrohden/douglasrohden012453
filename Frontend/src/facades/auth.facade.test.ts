import { describe, it, expect, vi, beforeEach } from 'vitest';
import { firstValueFrom, take } from 'rxjs';
import { authFacade } from '../facades/auth.facade';
import { authStore } from '../store/auth.store';
import { authService } from '../services/authService';

vi.mock('../services/authService');

describe('AuthFacade', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    authStore.clearAuthentication();
  });

  describe('authState$', () => {
    it('should emit current auth state', async () => {
      const state = await firstValueFrom(authFacade.authState$.pipe(take(1)));
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('currentAuthState', () => {
    it('should return current auth state', () => {
      authStore.setAuthenticated('token', 'refresh', 'test');
      expect(authFacade.currentAuthState.user).toBe('test');
      expect(authFacade.currentAuthState.isAuthenticated).toBe(true);
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when authenticated', () => {
      authStore.setAuthenticated('token', 'refresh', 'user');

      expect(authFacade.isAuthenticated).toBe(true);
    });

    it('should return false when not authenticated', () => {
      authStore.clearAuthentication();

      expect(authFacade.isAuthenticated).toBe(false);
    });
  });

  describe('currentUser', () => {
    it('should return current user', () => {
      authStore.setAuthenticated('token', 'refresh', 'testuser');

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
      (authService.login as any).mockResolvedValue(mockResponse);

      const result = await authFacade.login('user', 'pass');

      expect(result).toBe(mockResponse);
      expect(authService.login).toHaveBeenCalledWith('user', 'pass');
      expect(authStore.currentState.accessToken).toBe('token');
      expect(authStore.currentState.refreshToken).toBe('refresh');
      expect(authStore.currentState.user).toBe('user');
    });

    it('should clear auth on login failure', async () => {
      const error = new Error('Login failed');
      (authService.login as any).mockRejectedValue(error);

      await expect(authFacade.login('user', 'pass')).rejects.toThrow('Login failed');
      expect(authStore.currentState.isAuthenticated).toBe(false);
    });
  });

  describe('logout', () => {
    it('should clear authentication state', () => {
      authStore.setAuthenticated('token', 'refresh', 'user');

      authFacade.logout();

      expect(authStore.currentState.isAuthenticated).toBe(false);
      expect(authStore.currentState.accessToken).toBe(null);
      expect(authStore.currentState.refreshToken).toBe(null);
      expect(authStore.currentState.user).toBe(null);
    });
  });

  describe('getAccessToken', () => {
    it('should return access token', () => {
      authStore.setAuthenticated('token', 'refresh', 'user');

      expect(authFacade.getAccessToken()).toBe('token');
    });
  });

  describe('getRefreshToken', () => {
    it('should return refresh token', () => {
      authStore.setAuthenticated('token', 'refresh', 'user');

      expect(authFacade.getRefreshToken()).toBe('refresh');
    });
  });

  describe('updateTokens', () => {
    it('should update tokens with provided username', () => {
      authStore.setAuthenticated('oldtoken', 'oldrefresh', 'olduser');

      authFacade.updateTokens('newtoken', 'newrefresh', 'newuser');

      expect(authStore.currentState.accessToken).toBe('newtoken');
      expect(authStore.currentState.refreshToken).toBe('newrefresh');
      expect(authStore.currentState.user).toBe('newuser');
    });

    it('should use current user if no username provided', () => {
      authStore.setAuthenticated('oldtoken', 'oldrefresh', 'currentuser');

      authFacade.updateTokens('newtoken', 'newrefresh');

      expect(authStore.currentState.accessToken).toBe('newtoken');
      expect(authStore.currentState.refreshToken).toBe('newrefresh');
      expect(authStore.currentState.user).toBe('currentuser');
    });
  });

  describe('hasValidTokens', () => {
    it('should return true when both tokens exist', () => {
      authStore.setAuthenticated('token', 'refresh', 'user');

      expect(authFacade.hasValidTokens()).toBe(true);
    });

    it('should return false when access token is missing', () => {
      authStore.setState({ accessToken: null, refreshToken: 'refresh', isAuthenticated: false });

      expect(authFacade.hasValidTokens()).toBe(false);
    });

    it('should return false when refresh token is missing', () => {
      authStore.setState({ accessToken: 'token', refreshToken: null, isAuthenticated: false });

      expect(authFacade.hasValidTokens()).toBe(false);
    });
  });
});