/// <reference types="@testing-library/jest-dom" />
import ErrorBoundary from '@/components/error-boundary';
import { act, fireEvent, render, screen } from '@testing-library/react';


describe('ErrorBoundary', () => {
  const ThrowError = () => {
    return null;
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

    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /try again/i }),
    ).toBeInTheDocument();
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

    const tryAgainButton = screen.getByRole('button', { name: /try again/i });

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
