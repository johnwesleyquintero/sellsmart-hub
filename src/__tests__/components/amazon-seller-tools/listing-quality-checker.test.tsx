/// <reference types="@testing-library/jest-dom" />
/// <reference types="@testing-library/jest-dom" />
/// <reference types="@testing-library/jest-dom" />
import ListingQualityChecker from '@/components/amazon-seller-tools/listing-quality-checker';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

describe('ListingQualityChecker', () => {
  const mockListing = {
    title: 'Test Product',
    description: 'Test description',
    bulletPoints: ['Point 1', 'Point 2'],
    keywords: ['keyword1', 'keyword2'],
  };

  beforeEach(() => {
    // Mock API calls
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ score: 85, suggestions: [] }),
      }),
    ) as jest.Mock;
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('renders the component correctly', () => {
    render(<ListingQualityChecker />);
    expect(screen.getByText(/listing quality checker/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /analyze/i }),
    ).toBeInTheDocument();
  });

  it('handles file upload correctly', async () => {
    render(<ListingQualityChecker />);

    const file = new File([JSON.stringify(mockListing)], 'test-listing.json', {
      type: 'application/json',
    });

    const input = screen.getByLabelText(/upload listing/i);
    Object.defineProperty(input, 'files', {
      value: [file],
    });

    fireEvent.change(input);

    await waitFor(() => {
      expect(screen.getByText(/test product/i)).toBeInTheDocument();
    });
  });

  it('displays analysis results', async () => {
    render(<ListingQualityChecker />);

    const analyzeButton = screen.getByRole('button', { name: /analyze/i });
    fireEvent.click(analyzeButton);

    await waitFor(() => {
      expect(screen.getByText(/quality score/i)).toBeInTheDocument();
      expect(screen.getByText('85')).toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    global.fetch = jest.fn(() =>
      Promise.reject(new Error('API Error')),
    ) as jest.Mock;

    render(<ListingQualityChecker />);

    const analyzeButton = screen.getByRole('button', { name: /analyze/i });
    fireEvent.click(analyzeButton);

    await waitFor(() => {
      expect(screen.getByText(/error occurred/i)).toBeInTheDocument();
    });
  });

  it('validates input data', async () => {
    render(<ListingQualityChecker />);

    const file = new File(['invalid json'], 'invalid.json', {
      type: 'application/json',
    });

    const input = screen.getByLabelText(/upload listing/i);
    Object.defineProperty(input, 'files', {
      value: [file],
    });

    fireEvent.change(input);

    await waitFor(() => {
      expect(screen.getByText(/invalid file format/i)).toBeInTheDocument();
    });
  });
});
