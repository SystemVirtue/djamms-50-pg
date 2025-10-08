import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Client, Databases } from 'appwrite';
import { config } from '@shared/config/env';
import { AuthService } from './auth';
import type { AuthSession, PlayerState } from '@shared/types';

interface AppwriteContextType {
  client: Client;
  auth: AuthService;
  databases: Databases;
  playerState?: PlayerState;
  session: AuthSession | null;
  login: (email: string, redirectUrl?: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AppwriteContext = createContext<AppwriteContextType | undefined>(undefined);

interface AppwriteProviderProps {
  children: ReactNode;
}

export const AppwriteProvider: React.FC<AppwriteProviderProps> = ({ children }) => {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [playerState, setPlayerState] = useState<PlayerState>();
  const [isLoading, setIsLoading] = useState(true);

  const client = new Client()
    .setEndpoint(config.appwrite.endpoint)
    .setProject(config.appwrite.projectId);

  const databases = new Databases(client);
  const auth = new AuthService();

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const currentSession = await auth.getCurrentSession();
      setSession(currentSession);
    } catch (error) {
      console.error('Session check failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, redirectUrl?: string) => {
    await auth.sendMagicLink(email, redirectUrl);
  };

  const logout = () => {
    auth.clearSession();
    setSession(null);
    setPlayerState(undefined);
  };

  return (
    <AppwriteContext.Provider
      value={{
        client,
        auth,
        databases,
        playerState,
        session,
        login,
        logout,
        isLoading,
      }}
    >
      {children}
    </AppwriteContext.Provider>
  );
};

export const useAppwrite = () => {
  const context = useContext(AppwriteContext);
  if (!context) {
    throw new Error('useAppwrite must be used within AppwriteProvider');
  }
  return context;
};
