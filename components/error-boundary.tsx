"use client";

import { Button } from "@/components/ui/button";
import { ErrorWithContext } from "@/lib/error-reporting/types";
import { captureException } from "@sentry/nextjs";
import { AlertTriangle } from "lucide-react";
import type React from "react";
import { Component, ErrorInfo } from "react";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface CSVParseError extends Error {
  type: "csv_parse_error";
  details?: string;
}

interface CSVParseErrorEvent extends CustomEvent<CSVParseError> {
  type: "csvparsingerror";
}

interface ExtendedError extends Error {
  type?: string;
  details?: string;
}

declare global {
  interface WindowEventMap {
    csvparsingerror: CSVParseErrorEvent;
  }
}

export default class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const errorWithContext: ErrorWithContext = Object.assign(error, {
      context: {
        toolName: "KeywordDeduplicator",
        operation: "Processing",
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
      },
    });

    // Log to error tracking service
    captureException(errorWithContext);

    // Notify parent
    this.props.onError?.(errorWithContext, errorInfo);

    // Log locally
    console.error("Error caught by boundary:", {
      error: errorWithContext,
      info: errorInfo,
      state: this.state,
    });
  }

  componentDidMount(): void {
    window.addEventListener("csvparsingerror", this.handleCSVError);
  }

  componentWillUnmount(): void {
    window.removeEventListener("csvparsingerror", this.handleCSVError);
  }

  private handleCSVError = (event: CSVParseErrorEvent): void => {
    const error = event.detail;
    console.error("CSV parsing error:", error);
    this.setState({ hasError: true, error });
  };

  private handleReset = async (): Promise<void> => {
    try {
      // Attempt to save current state
      await this.saveCurrentState();

      // Clear error state
      this.setState({ hasError: false, error: null });

      // Reload only if necessary
      if (this.shouldReload()) {
        window.location.reload();
      }
    } catch (error) {
      console.error("Reset failed:", error);
      // Fallback to full reload
      window.location.reload();
    }
  };

  render(): React.ReactNode {
    const { hasError, error } = this.state;
    const { children } = this.props;

    if (hasError && error) {
      const extendedError = error as ExtendedError;
      return (
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-red-200 bg-red-50 p-8 text-center">
          <AlertTriangle className="mb-4 h-12 w-12 text-red-500" />
          <h2 className="mb-2 text-xl font-bold text-red-800">
            Something went wrong
          </h2>
          <p className="mb-6 max-w-md text-red-700">
            {extendedError.type === "csv_parse_error"
              ? `CSV Parsing Error: ${
                  extendedError.details || "Invalid CSV format"
                }`
              : error.message || "An unexpected error occurred"}
          </p>
          <Button onClick={this.handleReset}>Try again</Button>
        </div>
      );
    }

    return children;
  }
}
