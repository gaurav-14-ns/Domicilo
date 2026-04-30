import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

type Lead = {
  id: string;
  email: string | null;
  name: string | null;
  type: string | null;
  status: "new" | "contacted" | "closed";
  created_at: string;
};

export default function AdminLeads() {
  const [rows, setRows] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load leads", { description: error.message });
      setRows([]);
    } else {
      setRows(data ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const setStatus = async (id: string, status: Lead["status"]) => {
    setBusy(id);
    try {
      const { error } = await supabase
        .from("leads")
        .update({ status })
        .eq("id", id);

      if (error) throw error;

      toast.success(`Marked as ${status}`);
      await load();
    } catch (err: any) {
      toast.error("Failed", { description: err.message });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl md:text-3xl font-display font-bold">Leads</h1>

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <div className="font-semibold">No leads</div>
          <div className="text-sm text-muted-foreground">Nothing yet.</div>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="text-left p-3">Name</th>
                <th className="text-left p-3">Email</th>
                <th className="text-left p-3">Type</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Created</th>
                <th className="text-right p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((l) => (
                <tr key={l.id} className="border-t border-border">
                  <td className="p-3">{l.name || "—"}</td>
                  <td className="p-3 text-muted-foreground">{l.email || "—"}</td>
                  <td className="p-3">{l.type || "—"}</td>
                  <td className="p-3">
                    <Badge variant="outline" className="capitalize">
                      {l.status}
                    </Badge>
                  </td>
                  <td className="p-3 text-xs text-muted-foreground">
                    {new Date(l.created_at).toLocaleString()}
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busy === l.id}
                        onClick={() => setStatus(l.id, "contacted")}
                      >
                        Contacted
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busy === l.id}
                        onClick={() => setStatus(l.id, "closed")}
                      >
                        Close
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
