'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  componentName?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  renderCount: number;
}

class InfiniteRenderCatcher extends Component<Props, State> {
  private renderTimestamps: number[] = [];

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      renderCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Check if this is an infinite render error
    const isInfiniteRender =
      error.message.includes('Maximum update depth exceeded') ||
      error.message.includes('Too many re-renders') ||
      error.message.includes('Cannot update a component');

    return {
      hasError: true,
      error,
      renderCount: 0,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🚨 InfiniteRenderCatcher caught error:', error);
    console.error('📋 Error info:', errorInfo);

    this.setState({
      error,
      errorInfo,
    });
  }

  componentDidMount() {
    this.checkRenderFrequency();
  }

  componentDidUpdate() {
    this.checkRenderFrequency();
  }

  checkRenderFrequency = () => {
    const now = Date.now();
    this.renderTimestamps.push(now);

    // Keep only last 10 seconds of timestamps
    this.renderTimestamps = this.renderTimestamps.filter((time) => now - time < 10000);

    // If we're rendering more than 50 times in 10 seconds, it's likely infinite
    if (this.renderTimestamps.length > 50 && !this.state.hasError) {
      console.error('🚨 INFINITE RENDER DETECTED: Too many renders in 10 seconds');
      this.setState({
        hasError: true,
        error: new Error(
          `Infinite render detected: ${this.renderTimestamps.length} renders in 10 seconds`
        ),
        renderCount: this.renderTimestamps.length,
      });
    }
  };

  handleReset = () => {
    this.renderTimestamps = [];
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      renderCount: 0,
    });
  };

  handleForceRefresh = () => {
    // Clear all caches and reload
    if ('caches' in window) {
      caches.keys().then((names) => {
        names.forEach((name) => caches.delete(name));
      });
    }
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {}

    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI for infinite render errors
      return (
        this.props.fallback || (
          <div className="min-h-screen bg-red-50 dark:bg-red-900/20 flex items-center justify-center p-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-red-200 dark:border-red-800 p-8 max-w-md w-full text-center">
              <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Infinite Render Detected
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Component: {this.props.componentName || 'Unknown'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                {this.state.error?.message || 'The component is stuck in an infinite render loop.'}
              </p>

              <div className="space-y-3">
                <button
                  onClick={this.handleReset}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </button>

                <button
                  onClick={this.handleForceRefresh}
                  className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Force Refresh & Clear Cache
                </button>

                <button
                  onClick={() => (window.location.href = '/')}
                  className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Go to Homepage
                </button>
              </div>

              {process.env.NODE_ENV === 'development' && (
                <details className="mt-6 text-left">
                  <summary className="text-sm text-gray-500 cursor-pointer">Debug Info</summary>
                  <pre className="text-xs text-gray-400 mt-2 bg-gray-100 dark:bg-gray-700 p-2 rounded overflow-auto">
                    {this.state.error?.stack}
                  </pre>
                </details>
              )}
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

export default InfiniteRenderCatcher;
