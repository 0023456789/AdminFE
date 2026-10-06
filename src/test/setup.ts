import '@testing-library/jest-dom';
import { beforeAll, afterEach, afterAll } from 'vitest';
import { server } from './server';
import { resetMockPlans } from './handlers';

// Establish API mocking before all tests.
beforeAll(() => server.listen());

import { QueryClient } from '@tanstack/react-query';

const queryClient = new QueryClient();

// Reset any request handlers that we may add during the tests,
// so they don't affect other tests.
afterEach(() => {
  server.resetHandlers();
  resetMockPlans();
  queryClient.clear();
});

// Clean up after the tests are finished.
afterAll(() => server.close());

// Ant Design requires window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});
