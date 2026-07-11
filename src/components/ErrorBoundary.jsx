import React from 'react';
import PropTypes from 'prop-types';

/** App-wide error boundary so a render crash never shows a blank screen. */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('Uncaught error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
          <div className="text-4xl">🌧️</div>
          <h1 className="text-xl font-bold text-ink-900 dark:text-ink-100">
            Something went wrong
          </h1>
          <p className="max-w-md text-sm text-ink-600 dark:text-ink-400">
            {this.state.error?.message || 'An unexpected error occurred.'}
          </p>
          <button className="btn-primary" onClick={() => window.location.reload()}>
            Reload app
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node,
};

export default ErrorBoundary;
