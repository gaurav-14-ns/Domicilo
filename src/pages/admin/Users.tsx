import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Loader2, Search, ShieldOff, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { PLAN_PRICES_INR } from "@/lib/currency";

type Sub = {
  owner_id: string;
  plan: "starter" | "growth" | "scale";
  status: "trial" | "active" | "overdue" | "cancelled" | "expired";
};

type Row = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: string;
  suspended: boolean;
  sub?: Sub;
};

const PLANS: Sub["plan"][] = ["starter", "growth", "scale"];
const STATUSES: Sub["status"][] = ["trial", "active", "cancelled", "expired"];

export default function AdminUsers() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const [profiles, roles, subs] = await Promise.all([
      supabase.from("profiles").select("id, email, full_name, suspended"),
      supabase.from("user_roles").select("user_id, role"),
      supabase.from("subscriptions").select("owner_id, plan, status"),
    ]);
    const roleByUser = new Map((roles.data ?? []).map((r) => [r.user_id, r.role]));
    const subByOwner = new Map((subs.data ?? []).map((s: any) => [s.owner_id, s as Sub]));
    const out: Row[] = (profiles.data ?? []).map((p: any) => ({
      id: p.id,
      email: p.email,
      full_name: p.full_name,
      role: (roleByUser.get(p.id) as string) ?? "—",
      suspended: !!p.suspended,
      sub: subByOwner.get(p.id),
    }));
    setRows(out);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((r) => `${r.full_name ?? ""} ${r.email ?? ""}`.toLowerCase().includes(s));
  }, [rows, q]);

  const audit = async (action: string, target: string, meta: any) => {
    if (!user) return;
    await supabase.from("audit_logs").insert({
      actor_id: user.id, actor_email: user.email,
      action, target_type: "user", target_id: target, meta,
    });
  };

  const setPlan = async (row: Row, plan: Sub["plan"]) => {
    setBusy(row.id);
    try {
      const amount = PLAN_PRICES_INR[plan];
      const payload = {
        owner_id: row.id, plan, status: "active" as const, amount, currency_code: "INR",
        current_period_end: new Date(Date.now() + 30 * 86400_000).toISOString(),
        cancelled_at: null,
      };
      const { error } = row.sub
        ? await supabase.from("subscriptions").update(payload).eq("owner_id", row.id)
        : await supabase.from("subscriptions").insert(payload);
      if (error) throw error;
      await audit("admin.assign_plan", row.id, { plan });
      toast.success(`Plan set to ${plan}`, { description: row.email ?? "" });
      await load();
    } catch (err: any) {
      toast.error("Failed", { description: err.message });
    } finally { setBusy(null); }
  };

  const setStatus = async (row: Row, status: Sub["status"]) => {
    if (!row.sub) { toast.error("No subscription record"); return; }
    setBusy(row.id);
    try {
      const patch: any = { status };
      if (status === "cancelled") patch.cancelled_at = new Date().toISOString();
      const { error } = await supabase.from("subscriptions").update(patch).eq("owner_id", row.id);
      if (error) throw error;
      await audit("admin.set_sub_status", row.id, { status });
      toast.success(`Status: ${status}`);
      await load();
    } catch (err: any) {
      toast.error("Failed", { description: err.message });
    } finally { setBusy(null); }
  };

  const toggleSuspend = async (row: Row) => {
    setBusy(row.id);
    try {
      const next = !row.suspended;
      const { error } = await supabase.from("profiles").update({ suspended: next }).eq("id", row.id);
      if (error) throw error;
      await audit(next ? "admin.suspend_user" : "admin.reactivate_user", row.id, {});
      toast.success(next ? "User suspended" : "User reactivated");
      await load();
    } catch (err: any) {
      toast.error("Failed", { description: err.message });
    } finally { setBusy(null); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-2xl md:text-3xl font-display font-bold">Users</h1>
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search name or email…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <div className="font-display font-semibold">No users</div>
          <div className="text-sm text-muted-foreground">No matching accounts.</div>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-gradient-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="text-left p-3">Name</th>
                  <th className="text-left p-3">Email</th>
                  <th className="text-left p-3">Role</th>
                  <th className="text-left p-3">Plan</th>
                  <th className="text-left p-3">Sub status</th>
                  <th className="text-right p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => {
                  const isOwner = u.role === "owner";
                  return (
                    <tr key={u.id} className={`border-t border-border ${u.suspended ? "opacity-60" : ""}`}>
                      <td className="p-3 font-medium">
                        {u.full_name || "—"}
                        {u.suspended && <Badge variant="destructive" className="ml-2 text-[10px]">Suspended</Badge>}
                      </td>
                      <td className="p-3 text-muted-foreground">{u.email || "—"}</td>
                      <td className="p-3"><Badge variant="outline" className="capitalize">{u.role}</Badge></td>
                      <td className="p-3">
                        {isOwner ? (
                          <Select
                            value={u.sub?.plan ?? ""}
                            onValueChange={(v) => setPlan(u, v as Sub["plan"])}
                            disabled={busy === u.id}
                          >
                            <SelectTrigger className="h-8 w-32"><SelectValue placeholder="Assign…" /></SelectTrigger>
                            <SelectContent>
                              {PLANS.map((p) => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        ) : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="p-3">
                        {isOwner && u.sub ? (
                          <Select
                            value={u.sub.status}
                            onValueChange={(v) => setStatus(u, v as Sub["status"])}
                            disabled={busy === u.id}
                          >
                            <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        ) : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-end gap-1">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="ghost" disabled={busy === u.id} title={u.suspended ? "Reactivate" : "Suspend"}>
                                {u.suspended
                                  ? <ShieldCheck className="h-4 w-4 text-primary" />
                                  : <ShieldOff className="h-4 w-4 text-destructive" />}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  {u.suspended ? "Reactivate this user?" : "Suspend this user?"}
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  {u.suspended
                                    ? "They will regain access immediately on next sign-in."
                                    : "They will be signed out and blocked from logging in until reactivated."}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => toggleSuspend(u)}>
                                  {u.suspended ? "Reactivate" : "Suspend"}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
