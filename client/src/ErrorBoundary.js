// client/src/ErrorBoundary.js
import React from 'react';

/**
 * A robust error boundary that catches JS errors in child components.
 * If an error occurs, it shows a fallback screen with a "Reload" or "Retry" button.
 * 
 * You could integrate Sentry or LogRocket in componentDidCatch().
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state to show fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to console (or your external service)
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Example for Sentry:
    // Sentry.captureException(error, { extra: errorInfo });
    this.setState({ errorInfo: { error, errorInfo } });
  }

  handleReload = () => {
    // Reload the entire page
    window.location.reload();
  };

  handleRetry = () => {
    // Clear error boundary state, attempt to re-render children
    this.setState({ hasError: false, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 text-red-600">
          <h2 className="text-xl font-bold mb-2">Something went wrong.</h2>
          <p className="mb-4">An unexpected error occurred in this application.</p>

          {/* Show some debug info if you want (best not to show in prod) */}
          {process.env.NODE_ENV !== 'production' && this.state.errorInfo && (
            <pre className="text-sm bg-gray-100 p-2 text-red-800 overflow-auto max-h-48">
              {this.state.errorInfo.error && this.state.errorInfo.error.toString()}
              {'\n'}
              {this.state.errorInfo.errorInfo && this.state.errorInfo.errorInfo.componentStack}
            </pre>
          )}

          <div className="flex space-x-2 mt-4">
            <button
              onClick={this.handleReload}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
            >
              Reload Page
            </button>
            <button
              onClick={this.handleRetry}
              className="bg-gray-300 hover:bg-gray-400 text-black px-3 py-1 rounded"
            >
              Retry Without Reload
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
