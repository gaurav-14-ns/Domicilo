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
};

type State = {
  hasError: boolean;
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
    };
  }

  static getDerivedStateFromError() {
    return {
      hasError: true,
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
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-background">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-lg">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertTriangle className="h-7 w-7" />
            </div>

            <h1 className="text-2xl font-bold font-display">
              Something went wrong
            </h1>

            <p className="mt-2 text-sm text-muted-foreground">
              The application encountered an unexpected error.
              Reload the page to continue.
            </p>

            <Button
              className="mt-6 w-full"
              onClick={
                this.reload
              }
            >
              <RefreshCw className="h-4 w-4" />
              Reload application
            </Button>
          </div>
        </div>
      );
    }

    return this.props
      .children;
  }
}
