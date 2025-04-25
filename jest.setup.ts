import { jest } from '@jest/globals';
import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';

// Configure testing library
configure({
  testIdAttribute: 'data-testid',
});

// Mock window.matchMedia
import { MockInstance } from 'jest-mock';

interface MatchMediaMock extends MockInstance<(...args: unknown[]) => unknown> {
  matches: boolean;
  media: string;
  onchange: null;
  addListener: jest.Mock;
  removeListener: jest.Mock;
  addEventListener: jest.Mock;
  removeEventListener: jest.Mock;
  dispatchEvent: jest.Mock;
}

interface MediaQueryList {
  matches: boolean;
  media: string;
  onchange: null;
  addListener: (listener: EventListenerOrEventListenerObject) => void;
  removeListener: (listener: EventListenerOrEventListenerObject) => void;
  addEventListener: (
    type: string,
    listener: EventListenerOrEventListenerObject,
  ) => void;
  removeEventListener: (
    type: string,
    listener: EventListenerOrEventListenerObject,
  ) => void;
  dispatchEvent: (event: Event) => boolean;
}

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest
    .fn<(query: string) => MediaQueryList>()
    .mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(() => true), // Or false, depending on the desired behavior
    })),
});

// Mock ResizeObserver
// Properly type browser environment for TypeScript
declare global {
  interface Window {
    ResizeObserver: typeof ResizeObserver;
  }
}

window.ResizeObserver = class ResizeObserver {
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
};
