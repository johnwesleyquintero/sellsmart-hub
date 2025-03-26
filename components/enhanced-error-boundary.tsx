import React from 'react';
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

interface CSVParseError extends Error {
  type: 'csv_parse_error';
  details?: string;
}

class EnhancedErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by error boundary:", error, errorInfo);
  }

  private handleCSVError = (event: CustomEvent<CSVParseError>) => {
    this.setState({
      hasError: true,
      error: event.detail
    });
  };

  componentDidMount() {
    window.addEventListener(
      "csvparsingerror",
      this.handleCSVError as EventListener
    );
  }

  componentWillUnmount() {
    window.removeEventListener(
      "csvparsingerror",
      this.handleCSVError as EventListener
    );
  }

  private resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-red-200 bg-red-50 p-8 text-center dark:border-red-800/30 dark:bg-red-900/20">
          <AlertTriangle className="mb-4 h-12 w-12 text-red-500 dark:text-red-400" />
          <h2 className="mb-2 text-xl font-bold text-red-800 dark:text-red-400">
            Something went wrong
          </h2>
          <p className="mb-6 max-w-md text-red-700 dark:text-red-300">
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <Button
            onClick={() => {
              this.resetError();
              window.location.reload();
            }}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Reload Page
          </Button>
          {this.state.error && process.env.NODE_ENV === "development" && (
            <div className="mt-6 max-w-md overflow-auto rounded border border-red-300 bg-white p-4 text-left text-sm text-red-800 dark:border-red-800/50 dark:bg-red-950/50 dark:text-red-300">
              <p className="font-mono font-bold">
                {this.state.error.name}: {this.state.error.message}
              </p>
              <pre className="mt-2 text-xs">{this.state.error.stack}</pre>
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default EnhancedErrorBoundary;