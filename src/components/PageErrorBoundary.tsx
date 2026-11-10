import { Component, type ReactNode } from "react";

type Props = { children: ReactNode; fallback?: ReactNode };

export default class PageErrorBoundary extends Component<Props, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (!this.state.failed) return this.props.children;
    if (this.props.fallback !== undefined) return this.props.fallback;

    return (
      <section className="page-shell" role="alert">
        <div className="max-w-2xl">
          <h1 className="page-title">This page couldn’t load.</h1>
          <p className="page-lead mt-6">
            Check your connection and reload to get the latest version of this page.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-8 inline-flex min-h-12 items-center rounded-full bg-white px-7 text-sm font-semibold text-black"
          >
            Reload page
          </button>
        </div>
      </section>
    );
  }
}
