// Test setup file
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

global.localStorage = localStorageMock as any;

// Mock fetch
global.fetch = vi.fn();

// Mock window.location
delete (window as any).location;
window.location = { href: '', origin: 'http://localhost:3001' } as any;
