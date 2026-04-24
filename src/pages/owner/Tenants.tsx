import { useMemo, useState } from "react";
import { useDataStore } from "@/store/DataStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import { PauseCircle, PlayCircle, UserMinus, Trash2, Search, Plus, Pencil, LogOut } from "lucide-react";
import { todayISO } from "@/lib/format";
import { useCurrency } from "@/hooks/useCurrency";
import type { Tenant, TenantStatus } from "@/store/types";

type FormState = {
  name: string; phone: string; email: string;
  propertyId: string; room: string;
  rent: string; deposit: string;
  startDate: string; status: TenantStatus;
};
const emptyForm: FormState = {
  name: "", phone: "", email: "", propertyId: "", room: "",
  rent: "", deposit: "", startDate: todayISO(), status: "active",
};

export default function Tenants() {
  const { data, addTenant, updateTenant, removeTenant, setTenantStatus, moveOutTenant } = useDataStore();
  const { tenants, properties } = data;
  const { fmt, symbol } = useCurrency();

  const [q, setQ] = useState("");
  const [propertyFilter, setPropertyFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return tenants.filter((t) => {
      if (propertyFilter !== "all" && t.propertyId !== propertyFilter) return false;
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      if (s && !`${t.name} ${t.room} ${t.property} ${t.email} ${t.phone}`.toLowerCase().includes(s)) return false;
      return true;
    });
  }, [tenants, q, propertyFilter, statusFilter]);

  const openCreate = () => { setEditId(null); setForm(emptyForm); setOpen(true); };
  const openEdit = (t: Tenant) => {
    setEditId(t.id);
    setForm({
      name: t.name, phone: t.phone, email: t.email,
      propertyId: t.propertyId ?? "", room: t.room,
      rent: String(t.rent), deposit: String(t.deposit),
      startDate: t.startDate, status: t.status,
    });
    setOpen(true);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.propertyId || !form.room.trim()) {
      toast.error("Missing details", { description: "Name, property and room are required." });
      return;
    }
    const rent = Math.max(0, Number(form.rent) || 0);
    const deposit = Math.max(0, Number(form.deposit) || 0);
    if (editId) {
      updateTenant(editId, {
        name: form.name.trim(), phone: form.phone.trim(), email: form.email.trim(),
        propertyId: form.propertyId, room: form.room.trim(),
        rent, deposit, startDate: form.startDate, status: form.status,
      });
      toast.success("Tenant updated", { description: form.name });
    } else {
      addTenant({
        name: form.name.trim(), phone: form.phone.trim(), email: form.email.trim(),
        propertyId: form.propertyId, room: form.room.trim(),
        rent, deposit, startDate: form.startDate, status: form.status,
      } as any);
      toast.success("Tenant added", { description: form.name });
    }
    setOpen(false); setForm(emptyForm); setEditId(null);
  };

  const togglePause = (t: Tenant) => {
    const next = t.status === "paused" ? "active" : "paused";
    setTenantStatus(t.id, next);
    toast.success(next === "paused" ? "Billing paused" : "Billing resumed", { description: t.name });
  };
  const deactivate = (t: Tenant) => {
    setTenantStatus(t.id, "deactivated");
    toast.success("Tenant deactivated", { description: t.name });
  };
  const activate = (t: Tenant) => {
    setTenantStatus(t.id, "active");
    toast.success("Tenant activated", { description: t.name });
  };
  const moveOut = (t: Tenant) => {
    const dues = data.transactions
      .filter((x) => x.tenantId === t.id && x.status === "pending")
      .reduce((s, x) => s + Math.max(0, x.amount), 0);
    if (dues > 0) {
      toast.error("Settle dues first", { description: `${t.name} has ${fmt(dues)} pending. Clear or waive before move-out.` });
      return;
    }
    moveOutTenant(t.id);
    toast.success("Tenant moved out", { description: `${t.name} · room ${t.room} freed` });
  };
  const remove = (t: Tenant) => {
    if (t.status !== "moved_out") {
      toast.error("Cannot delete active tenant", { description: "Deactivate and complete move-out before deleting." });
      return;
    }
    removeTenant(t.id);
    toast.success("Tenant archived", { description: t.name });
  };

  const statusColor = (s: TenantStatus) =>
    s === "active" ? "bg-primary/15 text-primary"
    : s === "paused" ? "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400"
    : s === "moved_out" ? "bg-blue-500/15 text-blue-600 dark:text-blue-400"
    : "bg-muted text-muted-foreground";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold">Tenants</h1>
          <p className="text-muted-foreground">Add tenants, assign rooms, and control billing.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="hero" onClick={openCreate}><Plus className="h-4 w-4" /> Add tenant</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{editId ? "Edit tenant" : "New tenant"}</DialogTitle></DialogHeader>
            <form onSubmit={submit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label>Full name</Label><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                <div className="space-y-2"><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
              </div>
              <div className="space-y-2"><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Property</Label>
                  <Select value={form.propertyId} onValueChange={(v) => setForm({ ...form, propertyId: v })}>
                    <SelectTrigger><SelectValue placeholder="Select property" /></SelectTrigger>
                    <SelectContent>
                      {properties.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Room / unit</Label><Input required value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label>Rent ({symbol})</Label><Input type="number" min="0" required value={form.rent} onChange={(e) => setForm({ ...form, rent: e.target.value })} /></div>
                <div className="space-y-2"><Label>Deposit ({symbol})</Label><Input type="number" min="0" value={form.deposit} onChange={(e) => setForm({ ...form, deposit: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label>Start date</Label><Input type="date" required value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as TenantStatus })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="paused">Paused</SelectItem>
                      <SelectItem value="deactivated">Deactivated</SelectItem>
                      <SelectItem value="moved_out">Moved out</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter><Button type="submit" variant="hero">{editId ? "Save" : "Create"}</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search tenants…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
        </div>
        <Select value={propertyFilter} onValueChange={setPropertyFilter}>
          <SelectTrigger className="w-44"><SelectValue placeholder="All properties" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All properties</SelectItem>
            {properties.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="All statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
            <SelectItem value="deactivated">Deactivated</SelectItem>
            <SelectItem value="moved_out">Moved out</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <div className="font-display font-semibold">No tenants found</div>
          <div className="text-sm text-muted-foreground">Try adjusting filters or add your first tenant.</div>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-gradient-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="text-left p-3">Name</th>
                  <th className="text-left p-3 hidden md:table-cell">Property</th>
                  <th className="text-left p-3">Room</th>
                  <th className="text-left p-3">Rent</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-right p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => {
                  const isInactive = t.status === "deactivated" || t.status === "moved_out";
                  return (
                    <tr key={t.id} className="border-t border-border">
                      <td className="p-3">
                        <div className="font-medium">{t.name}</div>
                        <div className="text-xs text-muted-foreground">{t.email || t.phone}</div>
                      </td>
                      <td className="p-3 text-muted-foreground hidden md:table-cell">{t.property || "—"}</td>
                      <td className="p-3">{t.room}</td>
                      <td className="p-3">{fmt(t.rent)}</td>
                      <td className="p-3"><Badge className={statusColor(t.status)} variant="outline">{t.status.replace("_", " ")}</Badge></td>
                      <td className="p-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button size="sm" variant="ghost" onClick={() => openEdit(t)} title="Edit"><Pencil className="h-4 w-4" /></Button>
                          {isInactive ? (
                            <Button size="sm" variant="ghost" onClick={() => activate(t)} title="Activate"><PlayCircle className="h-4 w-4" /></Button>
                          ) : (
                            <Button size="sm" variant="ghost" onClick={() => togglePause(t)} title={t.status === "paused" ? "Resume billing" : "Pause billing"}>
                              {t.status === "paused" ? <PlayCircle className="h-4 w-4" /> : <PauseCircle className="h-4 w-4" />}
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" onClick={() => moveOut(t)} disabled={t.status === "moved_out"} title="Move out"><LogOut className="h-4 w-4" /></Button>
                          <Button size="sm" variant="ghost" onClick={() => deactivate(t)} disabled={t.status === "deactivated"} title="Deactivate"><UserMinus className="h-4 w-4" /></Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="ghost" title={t.status === "moved_out" ? "Archive" : "Move out first to archive"} disabled={t.status !== "moved_out"}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Archive {t.name}?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This permanently removes the tenant record. Historical transactions are kept for audit.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => remove(t)}>Archive</AlertDialogAction>
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
