import { Loader2, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { MaintenanceRequest, MaintenanceStatus } from "@/types/maintenance";

type Props = {
  requests: MaintenanceRequest[];
  loading: boolean;
  onUpdateStatus?: (id: string, status: MaintenanceStatus) => Promise<void>;
};

const priorityColor: Record<string, string> = {
  low: "bg-muted/50 text-muted-foreground",
  medium: "bg-muted text-muted-foreground",
  high: "bg-accent/10 text-accent",
  urgent: "bg-accent/10 text-accent",
};

const statusColor: Record<string, string> = {
  open: "bg-muted text-muted-foreground",
  in_progress: "bg-primary/10 text-primary",
  resolved: "bg-primary/10 text-primary",
  closed: "bg-muted text-muted-foreground",
};

const statusLabel: Record<string, string> = {
  open: "Open",
  in_progress: "In Progress",
  resolved: "Resolved",
  closed: "Closed",
};

export function RequestList({ requests, loading, onUpdateStatus }: Props) {
  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!requests || requests.length === 0) {
    return (
      <div className="flex flex-col items-center py-12 text-muted-foreground">
        <Wrench className="h-8 w-8 mb-2" />
        <p className="text-sm">No maintenance requests yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {requests.map((r) => (
        <div key={r.id} className="rounded-lg border border-border p-4 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-medium truncate">{r.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{r.description}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge className={priorityColor[r.priority]}>{r.priority}</Badge>
              <Badge className={statusColor[r.status]}>{statusLabel[r.status]}</Badge>
            </div>
          </div>
          {onUpdateStatus && r.status !== "resolved" && r.status !== "closed" && (
            <div className="flex items-center gap-2 pt-1">
              {r.status === "open" && (
                <Button variant="outline" size="sm" onClick={() => onUpdateStatus(r.id, "in_progress")}>
                  Start
                </Button>
              )}
              {r.status === "in_progress" && (
                <Button variant="outline" size="sm" onClick={() => onUpdateStatus(r.id, "resolved")}>
                  Resolve
                </Button>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
