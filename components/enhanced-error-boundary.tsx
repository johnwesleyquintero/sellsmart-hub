"use client";

import ErrorBoundary from './error-boundary';

interface Props {
  children: React.ReactNode;
}

export default function EnhancedErrorBoundary({ children }: Props) {
  return <ErrorBoundary>{children}</ErrorBoundary>;
}