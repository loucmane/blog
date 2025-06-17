// 01-error-boundaries.tsx
// Demonstrates proper error boundary implementation in Next.js 13+

// ❌ BAD: No error handling
export function BadComponent() {
  // This will crash the entire app if data is null
  const data = getSomeData()
  return <div>{data.title}</div>
}

// ❌ BAD: Try-catch in component (doesn't catch render errors)
export function AlsoBadComponent() {
  try {
    const data = getSomeData()
    return <div>{data.title}</div>
  } catch (error) {
    // This won't catch errors during render!
    return <div>Error occurred</div>
  }
}

// ❌ BAD: Generic error message
export function GenericError() {
  return <div>Something went wrong</div>
  // Not helpful for users!
}

// ✅ GOOD: Proper error.tsx file for error boundaries
// app/error.tsx - Root error boundary
'use client' // Error components must be Client Components

import * as React from 'react'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle, Home, RefreshCw } from 'lucide-react'

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Error boundary caught:', error)
    
    // Send to error tracking service
    if (typeof window !== 'undefined' && window.errorReporter) {
      window.errorReporter.logError(error, {
        digest: error.digest,
        component: 'RootErrorBoundary',
        url: window.location.href,
      })
    }
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 text-center">
        {/* Error icon */}
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
          <AlertCircle className="h-10 w-10 text-destructive" />
        </div>
        
        {/* Error message */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            Oops! Something went wrong
          </h1>
          <p className="text-muted-foreground">
            We apologize for the inconvenience. Our team has been notified and is working on a fix.
          </p>
        </div>

        {/* Error details for development */}
        {process.env.NODE_ENV === 'development' && (
          <details className="rounded-lg border bg-muted/50 p-4 text-left">
            <summary className="cursor-pointer text-sm font-medium">
              Error details (development only)
            </summary>
            <pre className="mt-2 whitespace-pre-wrap text-xs">
              {error.stack}
            </pre>
          </details>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Button onClick={reset} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Try again
          </Button>
          <Button variant="outline" asChild className="gap-2">
            <a href="/">
              <Home className="h-4 w-4" />
              Go to homepage
            </a>
          </Button>
        </div>

        {/* Additional help */}
        <p className="text-sm text-muted-foreground">
          If this problem persists, please{' '}
          <a href="/contact" className="underline underline-offset-4 hover:text-primary">
            contact our support team
          </a>
        </p>
      </div>
    </div>
  )
}

// ✅ GOOD: Nested error boundary for specific sections
// app/blog/error.tsx
'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { FileQuestion, ArrowLeft } from 'lucide-react'

export default function BlogError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="container flex min-h-[400px] flex-col items-center justify-center py-10">
      <FileQuestion className="h-16 w-16 text-muted-foreground mb-4" />
      <h2 className="text-2xl font-semibold mb-2">Unable to load blog posts</h2>
      <p className="text-muted-foreground mb-6 text-center max-w-md">
        We're having trouble loading the blog content. This might be a temporary issue.
      </p>
      <div className="flex gap-4">
        <Button variant="outline" onClick={() => window.history.back()} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Go back
        </Button>
        <Button onClick={reset}>Try again</Button>
      </div>
    </div>
  )
}

// ✅ GOOD: Error boundary with fallback UI component
// components/error-boundary.tsx
'use client'

import * as React from 'react'
import { Component, ReactNode } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
    this.props.onError?.(error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return <>{this.props.fallback}</>
      }

      return (
        <Alert variant="destructive" className="m-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Component Error</AlertTitle>
          <AlertDescription className="mt-2 space-y-2">
            <p>This component encountered an error and cannot be displayed.</p>
            <Button
              variant="outline"
              size="sm"
              onClick={this.handleReset}
              className="mt-2"
            >
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      )
    }

    return this.props.children
  }
}

// Usage example
export function ProtectedComponent() {
  return (
    <ErrorBoundary
      fallback={<div>Custom fallback UI</div>}
      onError={(error, errorInfo) => {
        // Send to monitoring service
        trackError(error, { component: 'ProtectedComponent', errorInfo })
      }}
    >
      <RiskyComponent />
    </ErrorBoundary>
  )
}

// 🎯 REAL-WORLD EXAMPLES

// Global error handler utility
// lib/error-reporter.ts
export class ErrorReporter {
  private queue: ErrorReport[] = []
  private isOnline = true

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleOnline())
      window.addEventListener('offline', () => this.handleOffline())
    }
  }

  logError(error: Error, context?: Record<string, any>) {
    const report: ErrorReport = {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      context,
      userAgent: navigator.userAgent,
      url: window.location.href,
    }

    if (this.isOnline) {
      this.sendReport(report)
    } else {
      this.queue.push(report)
    }
  }

  private async sendReport(report: ErrorReport) {
    try {
      await fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(report),
      })
    } catch (error) {
      console.error('Failed to send error report:', error)
      this.queue.push(report)
    }
  }

  private handleOnline() {
    this.isOnline = true
    this.flushQueue()
  }

  private handleOffline() {
    this.isOnline = false
  }

  private async flushQueue() {
    while (this.queue.length > 0) {
      const report = this.queue.shift()
      if (report) {
        await this.sendReport(report)
      }
    }
  }
}

// Initialize in app
declare global {
  interface Window {
    errorReporter: ErrorReporter
  }
}

if (typeof window !== 'undefined') {
  window.errorReporter = new ErrorReporter()
}

// 📝 ERROR BOUNDARY CHECKLIST:
// ✓ Use 'use client' directive
// ✓ Provide reset functionality
// ✓ Show user-friendly messages
// ✓ Log errors for monitoring
// ✓ Offer alternative actions
// ✓ Different boundaries for sections
// ✓ Development vs production UI
// ✓ Handle offline scenarios
// ✓ Accessibility considerations