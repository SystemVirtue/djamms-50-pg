import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  root: resolve(__dirname),
  envDir: resolve(__dirname, '../..'), // Load .env from project root
  plugins: [react()],
  resolve: {
    alias: {
      '@shared': resolve(__dirname, '../../packages/shared/src'),
      '@appwrite': resolve(__dirname, '../../packages/appwrite-client/src'),
      '@youtube-player': resolve(__dirname, '../../packages/youtube-player/src'),
    },
  },
  server: {
    port: 3001,
  },
  define: {
    'import.meta.env.VITE_APP_TYPE': JSON.stringify('player'),
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          youtube: ['react-youtube'],
        },
      },
    },
  },
});
