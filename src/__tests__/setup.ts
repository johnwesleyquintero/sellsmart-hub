import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';

// Configure testing library
configure({
  testIdAttribute: 'data-testid',
});

// Mock IntersectionObserver
class MockIntersectionObserver implements IntersectionObserver {
  readonly root: Element | null = null;
  readonly rootMargin: string = '';
  readonly thresholds: ReadonlyArray<number> = [];
  constructor(
    public callback: IntersectionObserverCallback,
    public options?: IntersectionObserverInit,
  ) {}
  observe(target: Element): void {
    // No-op or basic mock behavior
  }
  unobserve(target: Element): void {
    // No-op
  }
  disconnect(): void {
    // No-op
  }
  takeRecords(): IntersectionObserverEntry[] {
    return []; // Return empty array
  }
}

// Only assign if IntersectionObserver doesn't exist (e.g., in pure JSDOM)
if (typeof window !== 'undefined' && !window.IntersectionObserver) {
  // Use 'as any' carefully if types still conflict after implementing the interface
  window.IntersectionObserver = MockIntersectionObserver as any;
}

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
};
