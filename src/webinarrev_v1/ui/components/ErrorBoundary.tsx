import { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: { componentStack?: string } | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: { componentStack?: string }): void {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'rgb(var(--surface-base))' }}>
          <div
            className="max-w-2xl w-full rounded-2xl p-8 text-center"
            style={{
              background: 'rgb(var(--surface-elevated))',
              border: '1px solid rgb(var(--border-default))',
            }}
          >
            <div
              className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center"
              style={{
                background: 'rgb(var(--error) / 0.1)',
                border: '2px solid rgb(var(--error) / 0.2)',
              }}
            >
              <AlertTriangle className="w-8 h-8" style={{ color: 'rgb(var(--error))' }} />
            </div>

            <h1 className="text-2xl font-bold mb-3" style={{ color: 'rgb(var(--text-primary))' }}>
              Something went wrong
            </h1>

            <p className="text-sm mb-6" style={{ color: 'rgb(var(--text-muted))' }}>
              The application encountered an unexpected error. This has been logged for investigation.
            </p>

            {this.state.error && (
              <div
                className="mb-6 p-4 rounded-xl text-left"
                style={{
                  background: 'rgb(var(--surface-base))',
                  border: '1px solid rgb(var(--border-subtle))',
                }}
              >
                <p className="text-xs font-semibold mb-2" style={{ color: 'rgb(var(--text-muted))' }}>
                  Error Details:
                </p>
                <p
                  className="text-sm font-mono break-all"
                  style={{ color: 'rgb(var(--text-secondary))' }}
                >
                  {this.state.error.message}
                </p>
                {this.state.errorInfo?.componentStack && (
                  <details className="mt-3">
                    <summary
                      className="text-xs cursor-pointer"
                      style={{ color: 'rgb(var(--text-muted))' }}
                    >
                      Stack Trace
                    </summary>
                    <pre
                      className="mt-2 text-xs font-mono overflow-x-auto max-h-48 p-2 rounded"
                      style={{
                        background: 'rgb(var(--surface-elevated))',
                        color: 'rgb(var(--text-secondary))' ,
                      }}
                    >
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            <div className="flex items-center justify-center gap-3">
              <button onClick={this.handleReset} className="btn-primary">
                <RefreshCw className="w-4 h-4" />
                Reload Application
              </button>
            </div>

            <p className="text-xs mt-6" style={{ color: 'rgb(var(--text-muted))' }}>
              If this problem persists, please contact support.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
