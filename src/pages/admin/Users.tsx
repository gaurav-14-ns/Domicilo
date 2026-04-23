import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

type Row = { id: string; email: string | null; full_name: string | null; role: string };

export default function AdminUsers() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [profiles, roles] = await Promise.all([
        supabase.from("profiles").select("id, email, full_name"),
        supabase.from("user_roles").select("user_id, role"),
      ]);
      const roleByUser = new Map((roles.data ?? []).map((r) => [r.user_id, r.role]));
      const out: Row[] = (profiles.data ?? []).map((p) => ({
        id: p.id,
        email: p.email,
        full_name: p.full_name,
        role: (roleByUser.get(p.id) as string) ?? "—",
      }));
      setRows(out);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl md:text-3xl font-display font-bold">Users</h1>
      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <div className="font-display font-semibold">No users</div>
          <div className="text-sm text-muted-foreground">No accounts have been created yet.</div>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-gradient-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr><th className="text-left p-3">Name</th><th className="text-left p-3">Email</th><th className="text-left p-3">Role</th></tr>
            </thead>
            <tbody>
              {rows.map((u) => (
                <tr key={u.id} className="border-t border-border">
                  <td className="p-3 font-medium">{u.full_name || "—"}</td>
                  <td className="p-3 text-muted-foreground">{u.email || "—"}</td>
                  <td className="p-3"><Badge variant="outline" className="capitalize">{u.role}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
