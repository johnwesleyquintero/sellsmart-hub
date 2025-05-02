import { TextDecoder, TextEncoder } from 'text-encoding';
import 'whatwg-fetch'; // Import fetch polyfill
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
// src/setupTests.ts
import '@testing-library/jest-dom';

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
