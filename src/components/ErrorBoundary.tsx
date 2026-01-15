import { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#0f0720] to-[#1a0a2e] p-4">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 max-w-md text-center border border-white/20">
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-white mb-2">Något gick fel</h1>
            <p className="text-white/70 mb-6">
              Ett oväntat fel inträffade. Din data är sparad lokalt.
            </p>
            <button
              onClick={this.handleReset}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors mr-3"
            >
              Försök igen
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-colors"
            >
              Ladda om sidan
            </button>
            {this.state.error && (
              <details className="mt-6 text-left">
                <summary className="text-white/50 cursor-pointer text-sm">Tekniska detaljer</summary>
                <pre className="mt-2 p-3 bg-black/30 rounded text-xs text-red-300 overflow-auto">
                  {this.state.error.message}
                </pre>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
