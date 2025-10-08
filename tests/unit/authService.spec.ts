import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from '@appwrite/auth';

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('sendMagicLink', () => {
    it('should send magic link successfully', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });
      global.fetch = mockFetch;

      await authService.sendMagicLink('test@example.com');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/functions/'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({ 
            'Content-Type': 'application/json',
            'X-Appwrite-Project': expect.any(String)
          }),
        })
      );
    });

    it('should throw error on failed request', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => 'Server error',
      });
      global.fetch = mockFetch;

      await expect(authService.sendMagicLink('test@example.com')).rejects.toThrow(
        'Failed to send magic link'
      );
    });
  });

  describe('handleMagicLinkCallback', () => {
    it('should handle callback successfully and store token', async () => {
      const mockResponse = {
        token: 'mock-jwt-token',
        user: {
          userId: '123',
          email: 'test@example.com',
          role: 'staff' as const,
          autoplay: true,
          createdAt: '2023-01-01T00:00:00Z',
        },
      };

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          responseBody: JSON.stringify(mockResponse)
        }),
      });
      global.fetch = mockFetch;

      const session = await authService.handleMagicLinkCallback('secret123', 'user123');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/functions/'),
        expect.any(Object)
      );

      expect(session.token).toBe('mock-jwt-token');
      expect(session.user.email).toBe('test@example.com');
      expect(localStorage.setItem).toHaveBeenCalledWith('authToken', 'mock-jwt-token');
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'userData',
        JSON.stringify(mockResponse.user)
      );
    });

    it('should throw error on invalid callback', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => 'Invalid token',
      });
      global.fetch = mockFetch;

      await expect(
        authService.handleMagicLinkCallback('invalid', 'user123')
      ).rejects.toThrow('Magic link callback failed');
    });
  });

  describe('getCurrentSession', () => {
    it('should return null if no token stored', async () => {
      (localStorage.getItem as any).mockReturnValue(null);

      const session = await authService.getCurrentSession();

      expect(session).toBeNull();
    });

    it('should return session if token is valid', async () => {
      const mockUser = {
        userId: '123',
        email: 'test@example.com',
        role: 'staff' as const,
        autoplay: true,
        createdAt: '2023-01-01T00:00:00Z',
      };

      (localStorage.getItem as any).mockImplementation((key: string) => {
        if (key === 'authToken') return 'valid-token';
        if (key === 'userData') return JSON.stringify(mockUser);
        return null;
      });

      const mockFetch = vi.fn().mockResolvedValue({ ok: true });
      global.fetch = mockFetch;

      const session = await authService.getCurrentSession();

      expect(session).toBeTruthy();
      expect(session?.token).toBe('valid-token');
      expect(session?.user.email).toBe('test@example.com');
    });

    it('should clear session if token is invalid', async () => {
      (localStorage.getItem as any).mockReturnValue('invalid-token');

      const mockFetch = vi.fn().mockResolvedValue({ ok: false });
      global.fetch = mockFetch;

      const session = await authService.getCurrentSession();

      expect(session).toBeNull();
      expect(localStorage.removeItem).toHaveBeenCalledWith('authToken');
      expect(localStorage.removeItem).toHaveBeenCalledWith('userData');
    });
  });

  describe('clearSession', () => {
    it('should remove token and user data from localStorage', () => {
      authService.clearSession();

      expect(localStorage.removeItem).toHaveBeenCalledWith('authToken');
      expect(localStorage.removeItem).toHaveBeenCalledWith('userData');
    });
  });
});
