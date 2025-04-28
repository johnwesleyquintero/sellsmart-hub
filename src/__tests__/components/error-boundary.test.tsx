import ErrorBoundary from '@/components/error-boundary';
import { jest } from '@jest/globals';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { ReactElement } from 'react';

// Remove duplicate jest import and fix the multi-line import syntax
// jest and useFakeTimers are handled by @jest/globals

describe('ErrorBoundary', () => {
  beforeAll(() => {
    jest.useFakeTimers();
  });

  const ThrowError = () => {
    throw new Error('Test error');
  };

  beforeEach(() => {
    // Prevent console.error from cluttering test output
    // Mock implementation to avoid actual console logs during tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore mocks after each test
    jest.restoreAllMocks();
    // It's good practice to clear timers too if they were manipulated
    jest.clearAllTimers();
  });

  it('renders children when there is no error', () => {
    // jest.useFakeTimers(); // Already called in beforeAll
    const { container } = render(
      <ErrorBoundary fallback={<div>Error</div>}>
        <div>Test content</div>
      </ErrorBoundary>
    );
    // jest.useRealTimers(); // Not needed if timers are managed globally for the suite
    expect(container).toHaveTextContent('Test content');
  });

  it('renders error UI when there is an error', async () => {
    // Use act for the initial render that throws an error
    render(
      <ErrorBoundary fallback={<div>Error</div>}>
        <ThrowError />
      </ErrorBoundary>,
    );

    // Error boundaries catch errors during render and commit phases.
    // React updates state asynchronously. We need to wait for the UI update.
    // Running timers might be needed if the error boundary logic involves timeouts,
    // but often waiting for the UI update is sufficient.
    // Let's try waiting directly first.

    // await act(async () => { // act might not be needed here if waitFor handles the async update
    //   jest.runOnlyPendingTimers();
    // });

    await waitFor(
      () => {
        expect(screen.getByText('Something went wrong')).toBeInTheDocument();
        expect(
          screen.getByRole('button', { name: /Reload Page/i }),
        ).toBeInTheDocument();
      },
      // Increase timeout if necessary, but default should often be enough
      // { timeout: 3000 },
    );
  });

  it('resets error state when try again button is clicked', async () => {
    const TestComponent = ({ shouldThrow }: { shouldThrow: boolean }) => {
      if (shouldThrow) {
        throw new Error('Test error');
      }
      return <div>Test content</div>;
    };

    // Define rerenderFunc type explicitly
    let rerenderFunc: (ui: ReactElement) => void;

    // Initial render that throws an error
    const { rerender } = render(
      <ErrorBoundary fallback={<div>Error</div>}>
        <TestComponent shouldThrow={true} />
      </ErrorBoundary>,
    );
    rerenderFunc = rerender; // Assign the rerender function

    // Wait for the error UI to appear
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Reload Page/i })).toBeInTheDocument();
    });

    const tryAgainButton = screen.getByRole('button', { name: /Reload Page/i });

    // Rerender the component within the ErrorBoundary *without* the error condition
    // This simulates fixing the underlying cause before clicking "retry"
    // Use act for rerender as it causes state updates
    act(() => {
      rerenderFunc( // Use the stored rerender function
        <ErrorBoundary fallback={<div>Error</div>}>
          <TestComponent shouldThrow={false} />
        </ErrorBoundary>,
      );
    });


    // Click the button to reset the ErrorBoundary state
    // Use act for user events that cause state updates
    act(() => {
      fireEvent.click(tryAgainButton);
    });


    // Wait for the original content to reappear after reset
    await waitFor(() => {
      expect(screen.getByText('Test content')).toBeInTheDocument();
      expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
    });
  });
});
