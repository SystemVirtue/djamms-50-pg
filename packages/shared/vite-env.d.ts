/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APPWRITE_ENDPOINT: string;
  readonly VITE_APPWRITE_PROJECT_ID: string;
  readonly VITE_APPWRITE_DATABASE_ID: string;
  readonly VITE_APPWRITE_API_KEY: string;
  readonly VITE_APPWRITE_MAGIC_REDIRECT: string;
  readonly VITE_JWT_SECRET: string;
  readonly VITE_ALLOW_AUTO_CREATE_USERS: string;
  readonly VITE_YOUTUBE_API_KEY: string;
  readonly VITE_ENABLE_STRIPE_PAYMENTS: string;
  readonly VITE_STRIPE_PUBLISHABLE_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
