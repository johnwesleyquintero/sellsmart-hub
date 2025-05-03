import { TextDecoder, TextEncoder } from 'text-encoding';
import 'whatwg-fetch'; // Import fetch polyfill
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
// src/setupTests.ts
import '@testing-library/jest-dom';
import { server } from './__mocks__/server';

// Mock window if it's not already defined
if (typeof window === 'undefined') {
  global.window = {
    location: {
      href: '',
    },
  } as any;
}

// Mock window.matchMedia for components that use it
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // Deprecated
    removeListener: jest.fn(), // Deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock ResizeObserver for components that use it
class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

window.ResizeObserver = ResizeObserver;
// Mock the useToast hook
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

// Establish API mocking before all tests.
beforeAll(() => server.listen());

// Reset any request handlers that we may add during the tests,
// so they don't affect other tests.
afterEach(() => server.resetHandlers());

// Clean up after the tests are finished.
afterAll(() => server.close());
