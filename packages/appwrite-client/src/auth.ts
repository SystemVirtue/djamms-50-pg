import { Client, Account, Databases, Functions } from 'appwrite';
import { config } from '@shared/config/env';
import type { AuthSession, AuthUser } from '@shared/types/auth';

export class AuthService {
  private client: Client;
  private account: Account;
  private databases: Databases;
  private functions: Functions;

  constructor() {
    this.client = new Client()
      .setEndpoint(config.appwrite.endpoint)
      .setProject(config.appwrite.projectId);
    this.account = new Account(this.client);
    this.databases = new Databases(this.client);
    this.functions = new Functions(this.client);
  }

  async sendMagicLink(email: string, redirectUrl?: string): Promise<void> {
    const url = redirectUrl || config.auth.magicLinkRedirect;
    
    try {
      // Debug: Log the config values
      console.log('📋 Magic Link Send:');
      console.log('  - endpoint:', config.appwrite.endpoint);
      console.log('  - projectId:', config.appwrite.projectId);
      console.log('  - functionId:', config.appwrite.functions.magicLink);
      console.log('  - email:', email);
      console.log('  - redirectUrl:', url);
      
      // Use AppWrite SDK's Functions.createExecution
      const result = await this.functions.createExecution(
        config.appwrite.functions.magicLink,
        JSON.stringify({ 
          action: 'create',
          email, 
          redirectUrl: url 
        }),
        false // async execution
      );
      
      console.log('✅ Magic link execution:', result);
      
      // Check if execution succeeded
      if (result.status === 'failed') {
        console.error('❌ Magic link execution failed:', result.response);
        throw new Error('Failed to send magic link');
      }
      
      if (result.status === 'completed' && result.response) {
        try {
          const responseData = JSON.parse(result.response);
          console.log('✅ Magic link sent:', responseData);
        } catch (e) {
          console.log('✅ Magic link sent (non-JSON response)');
        }
      }
    } catch (error: any) {
      console.error('❌ Magic link error:', error);
      throw new Error(error.message || 'Failed to send magic link');
    }
  }

  async handleMagicLinkCallback(secret: string, userId: string): Promise<AuthSession> {
    try {
      console.log('🔗 Verifying magic link callback');
      console.log('  - userId:', userId);
      console.log('  - secret:', secret.substring(0, 10) + '...');
      
      // Use AppWrite SDK's Functions.createExecution
      const result = await this.functions.createExecution(
        config.appwrite.functions.magicLink,
        JSON.stringify({
          action: 'verify',
          secret, 
          userId 
        }),
        false
      );

      console.log('✅ Verify execution:', result);

      if (result.status === 'failed') {
        console.error('❌ Magic link verify failed:', result.response);
        throw new Error('Magic link verification failed');
      }

      if (!result.response) {
        throw new Error('No response from magic link verification');
      }

      const data = JSON.parse(result.response);
      console.log('✅ Magic link verified, user:', data.user?.email);
      
      // Store in localStorage
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('userData', JSON.stringify(data.user));
      
      const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
      
      return { token: data.token, user: data.user, expiresAt };
    } catch (error: any) {
      console.error('❌ Magic link callback error:', error);
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
