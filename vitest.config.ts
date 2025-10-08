import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/unit/**/*.spec.ts'],
    exclude: ['tests/e2e/**/*'],
  },
  resolve: {
    alias: {
      '@shared': resolve(__dirname, './packages/shared/src'),
      '@appwrite': resolve(__dirname, './packages/appwrite-client/src'),
      '@youtube-player': resolve(__dirname, './packages/youtube-player/src'),
    },
  },
});
