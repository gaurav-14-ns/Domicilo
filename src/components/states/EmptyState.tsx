import {
  ReactNode,
} from "react";

type Props = {
  title: string;

  description?: string;

  icon?: ReactNode;

  action?: ReactNode;
};

export function EmptyState({
  title,
  description,
  icon,
  action,
}: Props) {
  return (
    <div className="rounded-xl border border-dashed border-border p-12 text-center">
      {icon && (
        <div className="mb-4 flex justify-center text-muted-foreground">
          {icon}
        </div>
      )}

      <div className="font-display font-semibold text-lg">
        {title}
      </div>

      {description && (
        <div className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
          {description}
        </div>
      )}

      {action && (
        <div className="mt-6 flex justify-center">
          {action}
        </div>
      )}
    </div>
  );
}
