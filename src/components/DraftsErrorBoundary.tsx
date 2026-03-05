"use client";

import { Component, type ReactNode } from "react";

type Props = { children: ReactNode; fallback?: ReactNode };

type State = { hasError: boolean; error?: Error };

export class DraftsErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("DraftsErrorBoundary:", error, info);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-8 text-center">
          <p className="text-zinc-400 mb-2">Something went wrong loading drafts.</p>
          <p className="text-xs text-zinc-500 mb-4">{this.state.error?.message ?? "Unknown error"}</p>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false })}
            className="px-4 py-2 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-zinc-200 text-sm"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
