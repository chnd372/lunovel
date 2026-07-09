"use client";

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary — catches render-time exceptions in children and shows a
 * friendly fallback instead of the default Next.js "Application error" page.
 *
 * Why class component: React 18 still requires class components for
 * `componentDidCatch` / `getDerivedStateFromError`. Function components
 * with hooks can't catch errors in render.
 *
 * Used to wrap the Reader so a crash in TapFixMode / TextSelectionHandler /
 * PerbaikanKataModal doesn't nuke the whole chapter page.
 */
export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack?: string }) {
    // Log full context for post-mortem; user only sees the friendly message.
    console.error("[ErrorBoundary] Caught error:", error, info?.componentStack);
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    const { hasError, error } = this.state;
    if (!hasError) return this.props.children;

    if (this.props.fallback && error) {
      return this.props.fallback(error, this.reset);
    }

    return (
      <div className="min-h-screen flex items-center justify-center px-6 py-12 bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
        <div className="max-w-md w-full text-center space-y-4">
          <div className="text-6xl">⚠️</div>
          <h1 className="text-2xl font-bold">Terjadi Kesalahan</h1>
          <p className="text-sm opacity-70 leading-relaxed">
            Mode interaktif (Perbaiki Kata / pemilihan teks) menyebabkan error.
            Chapter dan komentar tetap bisa dibaca. Refresh untuk mengaktifkan
            ulang fitur interaktif.
          </p>
          {error && (
            <details className="text-left text-xs opacity-60 bg-black/5 dark:bg-white/5 rounded-lg p-3">
              <summary className="cursor-pointer font-medium">Detail teknis</summary>
              <pre className="mt-2 whitespace-pre-wrap break-all">{error.message}</pre>
            </details>
          )}
          <div className="flex gap-2 justify-center pt-2">
            <button
              onClick={this.reset}
              className="px-4 py-2 rounded-lg bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-sm font-medium"
            >
              Coba Lagi
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-lg bg-accent text-white hover:bg-accent/90 text-sm font-medium"
            >
              Refresh Halaman
            </button>
          </div>
        </div>
      </div>
    );
  }
}
