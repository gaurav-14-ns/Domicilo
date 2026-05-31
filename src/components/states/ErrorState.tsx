import {
  AlertTriangle,
  RefreshCw,
} from "lucide-react";

import {
  Button,
} from "@/components/ui/button";

type Props = {
  title?: string;

  description?: string;

  onRetry?: () => void;
};

export function ErrorState({
  title = "Something went wrong",
  description = "An unexpected error occurred while loading data.",
  onRetry,
}: Props) {
  return (
    <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-12">
      <div className="flex flex-col items-center justify-center text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertTriangle className="h-7 w-7" />
        </div>

        <div className="font-display font-semibold text-lg">
          {title}
        </div>

        <div className="mt-2 text-sm text-muted-foreground max-w-md">
          {description}
        </div>

        {onRetry && (
          <Button
            variant="outline"
            className="mt-6"
            onClick={onRetry}
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
        )}
      </div>
    </div>
  );
}
