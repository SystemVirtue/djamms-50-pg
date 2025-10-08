import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  root: resolve(__dirname),
  envDir: resolve(__dirname, '../..'), // Load .env from project root
  plugins: [react()],
  server: {
    port: 3000,
  },
  build: {
    sourcemap: true,
    outDir: resolve(__dirname, 'dist'),
  },
  resolve: {
    alias: {
      '@shared': resolve(__dirname, '../../packages/shared/src'),
      '@appwrite': resolve(__dirname, '../../packages/appwrite-client/src'),
    },
  },
});
