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
  const [selectedUser, setSelectedUser] = useState<Row | null>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [suspendedFilter, setSuspendedFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("name_asc");
  const [busy, setBusy] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

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

  useEffect(() => {
    if (!selectedUser) return;
    
    const loadLogs = async () => {
      setLogsLoading(true);
      try {
        const { data, error } = await supabase
          .from("audit_logs")
          .select("action, created_at")
          .eq("target_id", selectedUser.id)
          .order("created_at", { ascending: false })
          .limit(10);
        
        if (error) throw error;
        
        setAuditLogs(data ?? []);
      } catch (err: any) {
        toast.error("Failed to load audit logs", {
          description: err.message,
        });
        setAuditLogs([]);
      } finally {
        setLogsLoading(false);
      }
    };
    
    loadLogs();
  }, [selectedUser]);
  
  const filtered = useMemo(() => {
  const s = q.trim().toLowerCase();

  let result = rows.filter((r) => {
    const matchesSearch =
      !s ||
      `${r.full_name ?? ""} ${r.email ?? ""}`.toLowerCase().includes(s);

    const matchesRole =
      roleFilter === "all" || r.role === roleFilter;

    const matchesPlan =
      planFilter === "all" || r.sub?.plan === planFilter;

    const matchesStatus =
      statusFilter === "all" || r.sub?.status === statusFilter;

    const matchesSuspended =
      suspendedFilter === "all" ||
      (suspendedFilter === "yes" && r.suspended) ||
      (suspendedFilter === "no" && !r.suspended);

    return (
      matchesSearch &&
      matchesRole &&
      matchesPlan &&
      matchesStatus &&
      matchesSuspended
    );
  });

result.sort((a, b) => {
  if (sortBy === "name_asc")
    return (a.full_name || "").localeCompare(b.full_name || "");

  if (sortBy === "name_desc")
    return (b.full_name || "").localeCompare(a.full_name || "");

  if (sortBy === "role")
    return a.role.localeCompare(b.role);

  if (sortBy === "suspended")
    return Number(b.suspended) - Number(a.suspended);

  return 0;
});

return result;
}, [rows, q, roleFilter, planFilter, statusFilter, suspendedFilter, sortBy]);

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

  const bulkSuspend = async (suspend: boolean) => {
  if (selectedIds.length === 0) return;

  setBusy("bulk");

  try {
    const { error } = await supabase
      .from("profiles")
      .update({ suspended: suspend })
      .in("id", selectedIds);

    if (error) throw error;

    toast.success(
      suspend ? "Users suspended" : "Users reactivated"
    );

    setSelectedIds([]);
    await load();
  } catch (err: any) {
    toast.error("Bulk action failed", {
      description: err.message,
    });
  } finally {
    setBusy(null);
  }
  };

const bulkSetPlan = async (plan: Sub["plan"]) => {
  if (selectedIds.length === 0) return;

  setBusy("bulk");

  try {
    // Only owners should get plans
    const owners = rows.filter(
      (r) => selectedIds.includes(r.id) && r.role === "owner"
    );

    if (owners.length === 0) {
      toast.error("No owners selected");
      return;
    }

    const skipped = selectedIds.length - owners.length;
    const amount = PLAN_PRICES_INR[plan];

    const updates = owners.map((r) => ({
      owner_id: r.id,
      plan,
      status: "active",
      amount,
      currency_code: "INR",
      current_period_end: new Date(Date.now() + 30 * 86400_000).toISOString(),
      cancelled_at: null,
    }));

    const { error } = await supabase
      .from("subscriptions")
      .upsert(updates, { onConflict: "owner_id" });

    if (error) throw error;

    toast.success(
      `Plan set to ${plan} for ${owners.length} owner${
        owners.length > 1 ? "s" : ""
      }${skipped ? ` (skipped ${skipped} non-owners)` : ""}`
    );

    setSelectedIds([]);
    await load();
  } catch (err: any) {
    toast.error("Bulk plan update failed", {
      description: err.message,
    });
  } finally {
    setBusy(null);
  }
};

  const exportUsersCsv = () => {
  const headers = [
    "Name",
    "Email",
    "Role",
    "Plan",
    "Subscription Status",
    "Suspended",
  ];

  const rowsCsv = filtered.map((u) => [
    u.full_name || "",
    u.email || "",
    u.role,
    u.sub?.plan || "",
    u.sub?.status || "",
    u.suspended ? "Yes" : "No",
  ]);

  const csv = [
    headers.join(","),
    ...rowsCsv.map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
    ),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "users_export.csv";
  link.click();

  URL.revokeObjectURL(url);
};

return (
  <div className="space-y-6">
    {selectedIds.length > 0 && (
    <div className="flex items-center justify-between rounded-lg border border-border p-3 bg-muted/30">
      <span className="text-sm font-medium">
        {selectedIds.length} user{selectedIds.length > 1 ? "s" : ""} selected
      </span>
      
      <div className="flex gap-2 flex-wrap">
        <Button
          size="sm"
          variant="destructive"
          onClick={() => bulkSuspend(true)}
          disabled={busy === "bulk"}
          >
          Suspend
        </Button>
        
        <Button
          size="sm"
          variant="outline"
          onClick={() => bulkSuspend(false)}
          disabled={busy === "bulk"}
          >
          Reactivate
        </Button>
        
        <Select onValueChange={(v) => bulkSetPlan(v as Sub["plan"])}>
          <SelectTrigger className="h-8 w-[140px]">
            <SelectValue placeholder="Set Plan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="starter">Starter</SelectItem>
            <SelectItem value="growth">Growth</SelectItem>
            <SelectItem value="scale">Scale</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
    </div>  
    )}    
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-2xl md:text-3xl font-display font-bold">
          Users
        </h1>
        
        <div className="flex w-full sm:w-auto gap-2">
          <div className="relative w-full sm:w-[320px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search name or email…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-9"
              />
          </div>
          
          <Button
            type="button"
            variant="outline"
            onClick={exportUsersCsv}
            >
            Export CSV
          </Button>
        </div>
      </div>
      
      {/* Filters Row */}
      <div className="flex flex-wrap gap-2">
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="owner">Owner</SelectItem>
            <SelectItem value="tenant">Tenant</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>

        <Select value={planFilter} onValueChange={setPlanFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Plan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Plans</SelectItem>
            <SelectItem value="starter">Starter</SelectItem>
            <SelectItem value="growth">Growth</SelectItem>
            <SelectItem value="scale">Scale</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="trial">Trial</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>

        <Select value={suspendedFilter} onValueChange={setSuspendedFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Suspended" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="yes">Suspended</SelectItem>
            <SelectItem value="no">Active</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Sort By" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name_asc">Name A-Z</SelectItem>
            <SelectItem value="name_desc">Name Z-A</SelectItem>
            <SelectItem value="role">Role</SelectItem>
            <SelectItem value="suspended">Suspended First</SelectItem>
          </SelectContent>
        </Select>
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
                  <th className="text-left p-3">
                    <input
                      type="checkbox"
                      checked={
                        filtered.length > 0 &&
                        filtered.every((u) => selectedIds.includes(u.id))
                      }
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedIds(filtered.map((u) => u.id));
                        } else {
                          setSelectedIds([]);
                        }
                      }}
                      />
                  </th>
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
                      <td className="p-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(u.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedIds([...selectedIds, u.id]);
                            } else {
                              setSelectedIds(selectedIds.filter((id) => id !== u.id));
                            }
                          }}
                          />
                      </td>
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
                          
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setSelectedUser(u)}
                            >
                            View
                          </Button>
                          
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
    {selectedUser && (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-background border border-border rounded-xl p-6 w-full max-w-md">
        
        <h2 className="text-lg font-semibold mb-4">
          User Details
        </h2>
        
        <div className="space-y-2 text-sm">
          <div><strong>Name:</strong> {selectedUser.full_name || "—"}</div>
          <div><strong>Email:</strong> {selectedUser.email || "—"}</div>
          <div><strong>Role:</strong> {selectedUser.role}</div>
          <div><strong>Status:</strong> {selectedUser.suspended ? "Suspended" : "Active"}</div>
          <div><strong>Plan:</strong> {selectedUser.sub?.plan || "—"}</div>
        </div>

        <div className="mt-4 flex gap-2 flex-wrap">
          <Button
            size="sm"
            variant={selectedUser.suspended ? "outline" : "destructive"}
            onClick={async () => {
              await toggleSuspend(selectedUser);
              setSelectedUser(null);
            }}
            >
            {selectedUser.suspended ? "Reactivate User" : "Suspend User"}
          </Button>
        </div>

        {selectedUser.role === "owner" && (
      <Select
        value={selectedUser.sub?.plan ?? ""}
        onValueChange={async (v) => {
          await setPlan(selectedUser, v as Sub["plan"]);
          setSelectedUser(null);
        }}
        >
        <SelectTrigger className="h-8 w-[160px]">
          <SelectValue placeholder="Change Plan" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="starter">Starter</SelectItem>
          <SelectItem value="growth">Growth</SelectItem>
          <SelectItem value="scale">Scale</SelectItem>
        </SelectContent>
      </Select>
    )}
        
        <div className="mt-5">
          <div className="text-sm font-medium mb-2">Recent Activity</div>
          
          {logsLoading ? (
      <div className="text-xs text-muted-foreground flex items-center gap-2">
        <Loader2 className="h-3 w-3 animate-spin" /> Loading…
      </div>
    ) : auditLogs.length === 0 ? (
      <div className="text-xs text-muted-foreground">
        No recent actions
      </div>
    ) : (
      <div className="space-y-2 max-h-40 overflow-auto pr-1">
        {auditLogs.map((log, i) => (
        <div key={i} className="text-xs border border-border rounded p-2">
          <div className="font-medium">{log.action}</div>
          <div className="text-muted-foreground">
            {new Date(log.created_at).toLocaleString()}
          </div>
        </div>
      ))}
      </div>
    )}
        </div>
        
        <div className="mt-4 flex justify-end">
          <Button variant="outline" onClick={() => setSelectedUser(null)}>
            Close
          </Button>
        </div>
        </div>
    </div>
  )}
  </div>
);
}
