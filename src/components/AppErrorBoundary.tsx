import React from "react";

import {
  Button,
} from "@/components/ui/button";

import {
  AlertTriangle,
  RefreshCw,
} from "lucide-react";

type Props = {
  children: React.ReactNode;
  fallbackRender?: (props: { error: any; resetErrorBoundary: () => void }) => React.ReactNode;
};

type State = {
  hasError: boolean;
  error?: any;
  errorKey: number;
};

export class AppErrorBoundary extends React.Component<
  Props,
  State
> {
  constructor(
    props: Props
  ) {
    super(props);

    this.state = {
      hasError: false,
      errorKey: 0,
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
      "Application crash:",
      error
    );
    console.error(
      errorInfo
    );
  }

  reload = () => {
    window.location.reload();
  };

  render() {
    if (
      this.state.hasError
    ) {
      // Use custom fallback render if provided
      if (this.props.fallbackRender) {
        return this.props.fallbackRender({
          error: this.state.error,
          resetErrorBoundary: () => this.setState({ hasError: false, error: undefined, errorKey: 0 }),
        });
      }

      const msg =
        this.state.error
          ?.message ??
        "The application encountered an unexpected error.";

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <div className="w-full max-w-lg rounded-2xl border border-border/60 bg-gradient-card p-8 text-center shadow-elegant">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertTriangle className="h-8 w-8" />
            </div>

            <h1 className="text-2xl font-bold font-display tracking-tight">
              Something went wrong
            </h1>

            <p className="mt-2 text-sm text-muted-foreground font-alt leading-relaxed">
              {msg}
            </p>

            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                className="w-full sm:w-auto"
                onClick={
                  this.reload
                }
              >
                <RefreshCw className="h-4 w-4" />
                Reload application
              </Button>

              <Button
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => {
                  window.location.href =
                    "/auth";
                }}
              >
                Back to sign in
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props
      .children;
  }
}
