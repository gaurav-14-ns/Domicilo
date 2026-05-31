import {
  Loader2,
} from "lucide-react";

type Props = {
  title?: string;
};

export function LoadingState({
  title = "Loading...",
}: Props) {
  return (
    <div className="rounded-xl border border-border p-12">
      <div className="flex flex-col items-center justify-center text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />

        <div className="font-medium">
          {title}
        </div>

        <div className="text-sm text-muted-foreground mt-1">
          Please wait while data is being loaded.
        </div>
      </div>
    </div>
  );
}
