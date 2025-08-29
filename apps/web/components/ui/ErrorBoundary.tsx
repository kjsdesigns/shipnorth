import React, { Component, ReactNode, ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // Here you could also send to error reporting service
    // e.g., Sentry.captureException(error);
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8">
            <div className="text-center">
              <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
              <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
                Something went wrong
              </h2>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                We're sorry, but something unexpected happened. Please try refreshing the page.
              </p>
            </div>

            <div className="space-y-4">
              <button
                onClick={this.handleRetry}
                className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </button>

              <button
                onClick={() => window.location.reload()}
                className="w-full flex justify-center items-center py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Refresh Page
              </button>
            </div>

            {/* Error details in development */}
            {this.props.showDetails &&
              process.env.NODE_ENV === 'development' &&
              this.state.error && (
                <details className="mt-8">
                  <summary className="cursor-pointer text-sm font-medium text-gray-900 dark:text-white hover:text-gray-700 dark:hover:text-gray-300">
                    Error Details (Development)
                  </summary>
                  <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                    <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                      {this.state.error.name}: {this.state.error.message}
                    </h3>
                    {this.state.error.stack && (
                      <pre className="mt-2 text-xs text-red-700 dark:text-red-300 overflow-auto">
                        {this.state.error.stack}
                      </pre>
                    )}
                    {this.state.errorInfo?.componentStack && (
                      <>
                        <h4 className="mt-4 text-sm font-medium text-red-800 dark:text-red-200">
                          Component Stack:
                        </h4>
                        <pre className="mt-2 text-xs text-red-700 dark:text-red-300 overflow-auto">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </>
                    )}
                  </div>
                </details>
              )}

            {/* Contact support */}
            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                If this problem persists, please{' '}
                <a
                  href="mailto:support@shipnorth.ca"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  contact support
                </a>
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook version for functional components
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}

// Simple error fallback components
export function SimpleErrorFallback({ error, retry }: { error?: Error; retry?: () => void }) {
  return (
    <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
      <div className="flex items-center space-x-2">
        <AlertTriangle className="h-5 w-5 text-red-500" />
        <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Something went wrong</h3>
      </div>
      <p className="mt-2 text-sm text-red-700 dark:text-red-300">
        {error?.message || 'An unexpected error occurred'}
      </p>
      {retry && (
        <button
          onClick={retry}
          className="mt-3 text-sm text-red-800 dark:text-red-200 hover:text-red-900 dark:hover:text-red-100 underline"
        >
          Try again
        </button>
      )}
    </div>
  );
}

export function MinimalErrorFallback() {
  return (
    <div className="flex items-center justify-center p-8 text-gray-500 dark:text-gray-400">
      <AlertTriangle className="h-5 w-5 mr-2" />
      <span className="text-sm">Unable to load content</span>
    </div>
  );
}

export default ErrorBoundary;
