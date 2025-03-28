"use client";

import { Button } from "@/components/ui/button";
import { captureException } from "@sentry/nextjs";
import { AlertTriangle } from "lucide-react";
import dynamic from "next/dynamic";
import type React from "react";
import { Component, ErrorInfo, Suspense } from "react";

// Dynamically import ClientOnly with no SSR
const ClientOnly = dynamic(
  () => import("./client-only").then((mod) => mod.ClientOnly),
  {
    ssr: false,
  },
);

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  isHydrationError: boolean;
}

export default class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  private hydrationComplete: boolean = false;
  private hasSetHydrationError: boolean = false;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      isHydrationError: false,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    const isHydrationError =
      typeof window !== "undefined" &&
      !window.__NEXT_DATA__?.props &&
      (error.message.includes("hydrat") ||
        error.message.includes("content does not match") ||
        error.message.includes("Text content does not match") ||
        error.message.includes("Minified React error #418") ||
        error.message.includes("Minified React error #419"));

    return {
      hasError: true,
      error,
      isHydrationError,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Handle hydration errors differently
    if (this.state.isHydrationError && !this.hasSetHydrationError) {
      this.hasSetHydrationError = true;
      // Force client-side render without reload
      this.setState({ hasError: false, error: null });
      return;
    }

    captureException(error, {
      extra: {
        ...errorInfo,
        isHydrationError: this.state.isHydrationError,
        hydrationComplete: this.hydrationComplete,
      },
    });

    if (this.state.isHydrationError && !this.hydrationComplete) {
      // Prevent infinite reload loops
      if (!sessionStorage.getItem("hydrationRetry")) {
        sessionStorage.setItem("hydrationRetry", "1");
        window.location.reload();
      }
    }
  }

  componentDidMount(): void {
    this.hydrationComplete = true;
    window.addEventListener("csvparsingerror", this.handleCSVError);

    // Clear hydration retry flag
    sessionStorage.removeItem("hydrationRetry");
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
      this.setState({
        hasError: false,
        error: null,
        isHydrationError: false,
      });

      // Only reload for non-hydration errors
      if (!this.state.isHydrationError && this.shouldReload()) {
        window.location.reload();
      }
    } catch (error) {
      console.error("Reset failed:", error);
      window.location.reload();
    }
  };

  render(): React.ReactNode {
    const { hasError, error, isHydrationError } = this.state;
    const { children, fallback } = this.props;

    if (isHydrationError && !this.hydrationComplete) {
      return (
        <Suspense fallback={null}>
          <ClientOnly>{children}</ClientOnly>
        </Suspense>
      );
    }

    if (hasError && error) {
      if (isHydrationError) {
        return (
          <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-yellow-200 bg-yellow-50 p-8 text-center">
            <AlertTriangle className="mb-4 h-12 w-12 text-yellow-500" />
            <h2 className="mb-2 text-xl font-bold text-yellow-800">
              Loading Error
            </h2>
            <p className="mb-6 max-w-md text-yellow-700">
              There was an error loading this content. Retrying...
            </p>
          </div>
        );
      }

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
