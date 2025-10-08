// Environment validation and configuration
export const validateEnvironment = () => {
  const required = [
    'VITE_APPWRITE_ENDPOINT',
    'VITE_APPWRITE_PROJECT_ID',
    'VITE_APPWRITE_DATABASE_ID'
  ];
  
  const missing = required.filter(key => !import.meta.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
};

export const config = {
  appwrite: {
    endpoint: import.meta.env.VITE_APPWRITE_ENDPOINT || '',
    projectId: import.meta.env.VITE_APPWRITE_PROJECT_ID || '',
    databaseId: import.meta.env.VITE_APPWRITE_DATABASE_ID || '',
    apiKey: import.meta.env.VITE_APPWRITE_API_KEY || '',
    functions: {
      magicLink: '68e5a317003c42c8bb6a',
      playerRegistry: '68e5a41f00222cab705b',
      processRequest: '68e5acf100104d806321',
    },
  },
  auth: {
    magicLinkRedirect: import.meta.env.VITE_APPWRITE_MAGIC_REDIRECT || 
      (typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : ''),
    jwtSecret: import.meta.env.VITE_JWT_SECRET || '',
    allowAutoCreate: import.meta.env.VITE_ALLOW_AUTO_CREATE_USERS === 'true',
  },
  youtube: {
    apiKey: import.meta.env.VITE_YOUTUBE_API_KEY || '',
  },
  features: {
    stripePayments: import.meta.env.VITE_ENABLE_STRIPE_PAYMENTS === 'true',
    stripePublishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '',
  }
} as const;
