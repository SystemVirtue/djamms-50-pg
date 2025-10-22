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
      console.log('📧 Sending magic link via AppWrite Account.createMagicURLSession:');
      console.log('  - email:', email);
      console.log('  - redirectUrl:', url);
      
      try {
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
        
      } catch (error: any) {
        // If there's an active session, delete it and retry
        if (error.code === 401 && error.message?.includes('session is active')) {
          console.log('⚠️ Active session detected, clearing sessions...');
          await this.account.deleteSessions();
          console.log('✅ Sessions cleared');
          
          // Retry creating magic URL session
          const token = await this.account.createMagicURLSession(
            'unique()',
            email,
            url
          );
          
          console.log('✅ Magic URL session created after cleanup:', {
            userId: token.userId,
            expire: token.expire
          });
        } else {
          throw error;
        }
      }
      
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
      
      let session;
      let user;
      
      try {
        // Try to create the magic URL session
        session = await this.account.updateMagicURLSession(userId, secret);
        user = await this.account.get();
        console.log('✅ Magic URL session created successfully');
        
      } catch (error: any) {
        // Check if error is due to existing session
        if (error.code === 401 && error.message?.includes('session is active')) {
          console.log('⚠️ Session already active, checking current user...');
          
          try {
            // Get current session user
            const currentUser = await this.account.get();
            console.log('Current user:', currentUser.email);
            
            // If it's the same email, use the existing session
            if (currentUser.email === userId || currentUser.$id === userId) {
              console.log('✅ Using existing session for same user');
              user = currentUser;
              // Get current session
              const sessions = await this.account.listSessions();
              session = sessions.sessions[0]; // Use the active session
              
            } else {
              // Different user - delete all sessions and create new one
              console.log('⚠️ Different user logged in, deleting old sessions...');
              await this.account.deleteSessions();
              console.log('✅ Old sessions deleted');
              
              // Now create the new session
              session = await this.account.updateMagicURLSession(userId, secret);
              user = await this.account.get();
              console.log('✅ New session created for:', user.email);
            }
          } catch (sessionError: any) {
            console.error('Error handling existing session:', sessionError);
            // If we can't get current user, try deleting all sessions and retry
            try {
              await this.account.deleteSessions();
              session = await this.account.updateMagicURLSession(userId, secret);
              user = await this.account.get();
              console.log('✅ Session created after cleanup');
            } catch (retryError) {
              throw sessionError; // Re-throw original error
            }
          }
        } else {
          // Different error, re-throw
          throw error;
        }
      }

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
