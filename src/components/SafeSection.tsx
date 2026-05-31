import React from "react";

type Props = {
  name: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

type State = {
  hasError: boolean;
  error: any;
};

export class SafeSection extends React.Component<
  Props,
  State
> {
  constructor(
    props: Props
  ) {
    super(props);

    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(
    error: any
  ) {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(
    error: any,
    errorInfo: any
  ) {
    console.error(
      `[SafeSection:${this.props.name}] crashed:`,
      error
    );

    console.error(errorInfo);
  }

  render() {
    if (
      this.state.hasError
    ) {
      return (
        this.props
          .fallback ?? (
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
            <p className="font-medium font-display">
              Section &ldquo;
              {this.props.name}
              &rdquo; crashed
            </p>

            <p className="mt-1 text-xs text-muted-foreground font-mono">
              {this.state.error
                ?.message ??
                "Unknown error"}
            </p>

            <p className="mt-1 text-[10px] text-muted-foreground/60">
              Check console (F12) for details.
            </p>
          </div>
        )
      );
    }

    return this.props
      .children;
  }
}
