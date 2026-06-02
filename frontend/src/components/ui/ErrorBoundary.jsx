import React, { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Update state to trigger fallback UI on subsequent render
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Extensible: send audit logs to administrative backend systems
    console.error('[Error Boundary Caught Exception]:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[400px] flex-col items-center justify-center p-8 bg-dark-panel border border-red-900 border-opacity-30 rounded-2xl">
          <div className="w-16 h-16 rounded-full bg-red-950 bg-opacity-30 border border-red-500 flex items-center justify-center text-red-500 text-3xl mb-4">
            ⚠️
          </div>
          <h3 className="text-xl font-bold text-gray-100 mb-2">Workspace Thread Failure</h3>
          <p className="text-sm text-gray-400 text-center max-w-md mb-6 leading-relaxed">
            The UI thread crashed due to an unexpected analytical data parse boundary. Reset to reconnect telemetry.
          </p>
          <button
            onClick={this.handleReset}
            className="px-6 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium shadow-lg hover:shadow-red-900/30 transition-all duration-200"
          >
            Reconnect Telemetry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
