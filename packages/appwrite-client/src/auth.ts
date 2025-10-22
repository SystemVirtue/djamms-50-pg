import { Client, Account, Databases } from 'appwrite';
import { config } from '@shared/config/env';
import type { AuthSession, AuthUser } from '@shared/types/auth';

export class AuthService {
  private client: Client;
  private account: Account;
  private databases: Databases;

  constructor() {
    this.client = new Client()
      .setEndpoint(config.appwrite.endpoint)
      .setProject(config.appwrite.projectId);
    this.account = new Account(this.client);
    this.databases = new Databases(this.client);
  }

  async sendMagicLink(email: string, redirectUrl?: string): Promise<void> {
    const url = redirectUrl || config.auth.magicLinkRedirect;
    
    try {
      console.log('� Sending magic link via AppWrite Account.createMagicURLToken:');
      console.log('  - email:', email);
      console.log('  - redirectUrl:', url);
      
      // Use AppWrite's built-in magic URL session method
      // This creates a token and sends an email automatically
      const token = await this.account.createMagicURLSession(
        'unique()', // userId - AppWrite generates a unique ID
        email,
        url // redirect URL after clicking magic link
      );
      
      console.log('✅ Magic URL session created:', {
        userId: token.userId,
        expire: token.expire
      });
      
      // AppWrite automatically sends the email with the magic link
      console.log('✅ Magic link email sent automatically by AppWrite');
      
    } catch (error: any) {
      console.error('❌ Magic link error:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        type: error.type,
        response: error.response
      });
      throw new Error(error.message || 'Failed to send magic link');
    }
  }

  async handleMagicLinkCallback(secret: string, userId: string): Promise<AuthSession> {
    try {
      console.log('🔗 Verifying magic link callback via AppWrite Account.updateMagicURLSession');
      console.log('  - userId:', userId);
      console.log('  - secret:', secret.substring(0, 10) + '...');
      
      // Use AppWrite's built-in method to complete the magic URL session
      // This validates the secret token and creates an authenticated session
      const session = await this.account.updateMagicURLSession(
        userId,
        secret
      );

      console.log('✅ Magic URL session verified:', {
        userId: session.userId,
        expire: session.expire
      });

      // Get the current user account details
      const user = await this.account.get();
      
      console.log('✅ User logged in:', user.email);
      
      // Create a session object compatible with our AuthSession type
      const authUser: AuthUser = {
        userId: user.$id,
        email: user.email,
        role: 'staff', // Default role, could be customized
        venueId: undefined,
        autoplay: true,
        createdAt: user.$createdAt || new Date().toISOString(),
        updatedAt: user.$updatedAt || new Date().toISOString()
      };
      
      // Store session data
      // Note: AppWrite manages the session cookie automatically
      localStorage.setItem('userData', JSON.stringify(authUser));
      
      const expiresAt = new Date(session.expire).getTime();
      
      return { 
        token: session.$id, // Use session ID as token
        user: authUser, 
        expiresAt 
      };
    } catch (error: any) {
      console.error('❌ Magic link callback error:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        type: error.type
      });
      throw new Error(error.message || 'Magic link verification failed');
    }
  }

  async getCurrentSession(): Promise<AuthSession | null> {
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('userData');
    
    if (!token || !userData) {
      return null;
    }

    try {
      // Verify token is still valid
      const response = await fetch(`${config.appwrite.endpoint}/functions/auth/verify`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const user: AuthUser = JSON.parse(userData);
        return {
          token,
          user,
          expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000
        };
      } else {
        this.clearSession();
        return null;
      }
    } catch (error) {
      console.error('Session verification error:', error);
      this.clearSession();
      return null;
    }
  }

  clearSession(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
  }

  async updateUserPreferences(autoplay: boolean): Promise<void> {
    const session = await this.getCurrentSession();
    if (!session) {
      throw new Error('No active session');
    }

    try {
      await this.databases.updateDocument(
        config.appwrite.databaseId,
        'users',
        session.user.userId,
        { autoplay }
      );

      // Update local storage
      const userData = { ...session.user, autoplay };
      localStorage.setItem('userData', JSON.stringify(userData));
    } catch (error) {
      console.error('Update preferences error:', error);
      throw error;
    }
  }
}
