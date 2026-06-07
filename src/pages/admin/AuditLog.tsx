import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/states/ErrorState";

const PAGE_SIZE = 50;

type AuditEntry = {
  id: string;
  actor_email: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  meta: Record<string, any> | null;
  created_at: string;
};

export default function AdminAuditLog() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);

  const totalPages = Math.max(1, Math.ceil(logs.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const pagedLogs = logs.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (err) {
      setError(err?.message ?? "Failed to load audit log");
    } else {
      setLogs((data ?? []) as AuditEntry[]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchLogs(); }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (error) {
    return <ErrorState title="Failed to load audit log" description={error} onRetry={fetchLogs} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-display font-bold text-gradient">Audit Log</h1>
        <p className="text-sm text-muted-foreground">
          Track all actions performed across the platform.
        </p>
      </div>
      {logs.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No audit entries yet.</div>
      ) : (
        <>
          <div className="rounded-lg border border-border overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-3 py-2 font-medium">Time</th>
                  <th className="text-left px-3 py-2 font-medium">Actor</th>
                  <th className="text-left px-3 py-2 font-medium">Action</th>
                  <th className="text-left px-3 py-2 font-medium">Target</th>
                </tr>
              </thead>
              <tbody>
                {pagedLogs.map((log) => (
                  <tr key={log.id} className="border-b last:border-0 hover:bg-muted/20 transition-smooth">
                    <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="px-3 py-2">{log.actor_email ?? "—"}</td>
                    <td className="px-3 py-2 font-medium">{log.action}</td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {log.target_type ? `${log.target_type}/${log.target_id?.slice(0, 8)}` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3">
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={safePage <= 0}>
                <ChevronLeft className="h-4 w-4" /> Prev
              </Button>
              <span className="text-sm text-muted-foreground font-num">
                Page {safePage + 1} of {totalPages}
              </span>
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={safePage >= totalPages - 1}>
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
