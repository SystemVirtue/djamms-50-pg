import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  root: resolve(__dirname),
  resolve: {
    alias: {
      '@shared': resolve(__dirname, '../../packages/shared/src'),
      '@appwrite': resolve(__dirname, '../../packages/appwrite-client/src'),
    },
  },
  server: {
    port: 3005,
  },
  build: {
    sourcemap: true,
    outDir: resolve(__dirname, 'dist'),
  },
});
