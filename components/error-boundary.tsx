"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { AlertTriangle, RefreshCw } from "lucide-react"

interface ErrorBoundaryProps {
  children: React.ReactNode
}

interface CSVParseError extends Error {
  type: 'csv_parse_error';
  details?: string;
}

export default function ErrorBoundary({ children }: ErrorBoundaryProps) {
  const [hasError, setHasError] = useState(false)
  const [error, setError] = useState<Error | CSVParseError | null>(null)

  useEffect(() => {
    const errorHandler = (error: ErrorEvent) => {
      setHasError(true)
      setError(error.error)
      console.error("Error caught by error boundary:", error)
    }

    const handleCSVError = (error: CSVParseError) => {
      setHasError(true)
      setError(error)
      console.error("CSV parsing error:", error)
    }

    window.addEventListener("error", errorHandler)
    window.addEventListener("csvparsingerror", (e: CustomEvent<CSVParseError>) => handleCSVError(e.detail))

    return () => {
      window.removeEventListener("error", errorHandler)
      window.removeEventListener("csvparsingerror", (e: CustomEvent<CSVParseError>) => handleCSVError(e.detail))
    }
  }, [])

  if (hasError) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-red-200 bg-red-50 p-8 text-center dark:border-red-800/30 dark:bg-red-900/20">
        <AlertTriangle className="mb-4 h-12 w-12 text-red-500 dark:text-red-400" />
        <h2 className="mb-2 text-xl font-bold text-red-800 dark:text-red-400">Something went wrong</h2>
        <p className="mb-6 max-w-md text-red-700 dark:text-red-300">
          {error?.type === 'csv_parse_error' 
            ? `CSV Parsing Error: ${error.details || 'Invalid CSV format'}` 
            : 'We apologize for the inconvenience. An unexpected error has occurred.'}
        </p>
        <Button
          onClick={() => {
            setHasError(false)
            setError(null)
            window.location.reload()
          }}
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Reload Page
        </Button>
        {error && process.env.NODE_ENV === "development" && (
          <div className="mt-6 max-w-md overflow-auto rounded border border-red-300 bg-white p-4 text-left text-sm text-red-800 dark:border-red-800/50 dark:bg-red-950/50 dark:text-red-300">
            <p className="font-mono font-bold">
              {error.name}: {error.message}
            </p>
            <pre className="mt-2 text-xs">{error.stack}</pre>
          </div>
        )}
      </div>
    )
  }

  return <>{children}</>
}

