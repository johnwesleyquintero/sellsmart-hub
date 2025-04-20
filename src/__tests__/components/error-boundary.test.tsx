import ErrorBoundary from '@/components/error-boundary';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';

describe('ErrorBoundary', () => {
  beforeAll(() => {
    process.env.NODE_ENV = 'test';
  });
  const ThrowError = () => {
    throw new Error('Test error');
  };

  beforeEach(() => {
    // Prevent console.error from cluttering test output
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders children when there is no error', () => {
    const { container } = render(
      <ErrorBoundary>
        <div>Test content</div>
      </ErrorBoundary>,
    );
    expect(container).toHaveTextContent('Test content');
  });

  it('renders error UI when there is an error', async () => {
    await act(async () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>,
      );
    });
    // Force error boundary update
    await act(async () => {
      jest.runOnlyPendingTimers();
    });

    await waitFor(
      () => {
        expect(screen.getByText('Something went wrong')).toBeInTheDocument();
        expect(
          screen.getByRole('button', { name: /Reload Page/i }),
        ).toBeInTheDocument();
      },
      { timeout: 3000 },
    );
  });

  it('resets error state when try again button is clicked', async () => {
    const TestComponent = ({ shouldThrow }: { shouldThrow: boolean }) => {
      if (shouldThrow) throw new Error('Test error');
      return <div>Test content</div>;
    };

    let rerenderFunc: (element: React.ReactElement) => void;

    await act(async () => {
      const { rerender } = render(
        <ErrorBoundary>
          <TestComponent shouldThrow={true} />
        </ErrorBoundary>,
      );
      rerenderFunc = rerender;
    });

    const tryAgainButton = screen.getByRole('button', { name: /Reload Page/i });

    // Update the prop to prevent error on retry
    await act(async () => {
      rerenderFunc(
        <ErrorBoundary>
          <TestComponent shouldThrow={false} />
        </ErrorBoundary>,
      );
    });

    await act(async () => {
      fireEvent.click(tryAgainButton);
    });

    expect(screen.getByText('Test content')).toBeInTheDocument();
  });
});
