import '@testing-library/jest-dom';
import { TextDecoder, TextEncoder } from 'util';
import 'whatwg-fetch';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as typeof global.TextDecoder;
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

global.BroadcastChannel = class MockBroadcastChannel {
  close() {}
  postMessage() {}
} as any;
