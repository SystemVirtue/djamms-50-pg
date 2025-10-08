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
      // Debug: Log the config values
      console.log('📋 Config check:');
      console.log('  - endpoint:', config.appwrite.endpoint);
      console.log('  - projectId:', config.appwrite.projectId);
      console.log('  - functionId:', config.appwrite.functions.magicLink);
      
      // Construct the correct AppWrite Cloud Functions URL
      // endpoint is already "https://syd.cloud.appwrite.io/v1"
      const functionUrl = `${config.appwrite.endpoint}/functions/${config.appwrite.functions.magicLink}/executions`;
      
      console.log('🔗 Calling magic link function:', functionUrl);
      console.log('📧 Email:', email);
      console.log('🔄 Redirect URL:', url);
      
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Appwrite-Project': config.appwrite.projectId
        },
        body: JSON.stringify({ 
          body: JSON.stringify({ 
            action: 'create',
            email, 
            redirectUrl: url 
          })
        })
      });

      console.log('📡 Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Magic link API error:', response.status, errorText);
        throw new Error(`Failed to send magic link: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('✅ Magic link response:', result);
    } catch (error) {
      console.error('Magic link send error:', error);
      throw error;
    }
  }

  async handleMagicLinkCallback(secret: string, userId: string): Promise<AuthSession> {
    try {
      const functionUrl = `${config.appwrite.endpoint}/functions/${config.appwrite.functions.magicLink}/executions`;
      console.log('🔗 Verifying magic link at:', functionUrl);
      
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Appwrite-Project': config.appwrite.projectId
        },
        body: JSON.stringify({ 
          body: JSON.stringify({
            action: 'verify',
            secret, 
            userId 
          })
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Magic link verify error:', response.status, errorText);
        throw new Error(`Magic link callback failed: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Verify response:', result);
      const data = JSON.parse(result.responseBody);
      
      // Store in localStorage
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('userData', JSON.stringify(data.user));
      
      const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
      
      return { token: data.token, user: data.user, expiresAt };
    } catch (error) {
      console.error('Magic link callback error:', error);
      throw error;
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
