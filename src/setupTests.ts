jest.mock('@/lib/config', () => ({
  validateEnv: () => ({
    REDIS_URL: 'test',
    REDIS_TOKEN: 'test',
    GITHUB_TOKEN: 'test',
    LINKEDIN_API_KEY: 'test',
    NEXTAUTH_URL: 'test',
    NEXTAUTH_SECRET: 'test',
  }),
}));
import '@testing-library/jest-dom';
if (typeof TextEncoder === 'undefined') {
  // @ts-ignore
  global.TextEncoder = require('util').TextEncoder;
}
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
