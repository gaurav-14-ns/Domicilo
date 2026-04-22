import { useMemo, useState } from "react";
import { useDataStore } from "@/store/DataStore";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
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
import { Download, Search, Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { formatINR, todayISO } from "@/lib/format";
import type { Transaction, TransactionStatus, TransactionType } from "@/store/types";

const TYPES: TransactionType[] = ["Rent", "Water", "Electricity", "Maintenance", "Penalty", "Refund", "Other"];
const STATUSES: TransactionStatus[] = ["completed", "pending", "paused", "refund"];

type FormState = {
  date: string; tenantId: string; type: TransactionType;
  amount: string; status: TransactionStatus; note: string;
};
const emptyForm: FormState = {
  date: todayISO(), tenantId: "", type: "Maintenance",
  amount: "", status: "completed", note: "",
};

export default function Transactions() {
  const { data, addTransaction, updateTransaction, removeTransaction } = useDataStore();
  const { transactions, tenants, properties } = data;

  const [q, setQ] = useState("");
  const [propertyFilter, setPropertyFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    const min = minAmount === "" ? -Infinity : Number(minAmount);
    const max = maxAmount === "" ? Infinity : Number(maxAmount);
    return transactions.filter((t) => {
      if (propertyFilter !== "all" && t.propertyId !== propertyFilter) return false;
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      if (typeFilter !== "all" && t.type !== typeFilter) return false;
      if (from && t.date < from) return false;
      if (to && t.date > to) return false;
      if (t.amount < min || t.amount > max) return false;
      if (s && !`${t.tenant} ${t.type} ${t.note ?? ""} ${t.property ?? ""}`.toLowerCase().includes(s)) return false;
      return true;
    });
  }, [transactions, q, propertyFilter, statusFilter, typeFilter, minAmount, maxAmount, from, to]);

  const openCreate = () => { setEditId(null); setForm(emptyForm); setOpen(true); };
  const openEdit = (t: Transaction) => {
    setEditId(t.id);
    setForm({
      date: t.date, tenantId: t.tenantId ?? "",
      type: (t.type as TransactionType) ?? "Other",
      amount: String(t.amount), status: t.status, note: t.note ?? "",
    });
    setOpen(true);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(form.amount);
    if (Number.isNaN(amount)) {
      toast.error("Invalid amount"); return;
    }
    const finalAmount = form.type === "Refund" ? -Math.abs(amount) : amount;
    if (editId) {
      updateTransaction(editId, {
        date: form.date, tenantId: form.tenantId || undefined,
        type: form.type, amount: finalAmount, status: form.status, note: form.note,
        tenant: tenants.find((x) => x.id === form.tenantId)?.name,
        propertyId: tenants.find((x) => x.id === form.tenantId)?.propertyId,
        property: tenants.find((x) => x.id === form.tenantId)?.property,
      });
      toast.success("Transaction updated");
    } else {
      addTransaction({
        date: form.date, tenantId: form.tenantId || undefined,
        type: form.type, amount: finalAmount, status: form.status, note: form.note,
        tenant: tenants.find((x) => x.id === form.tenantId)?.name ?? "",
      });
      toast.success("Transaction added");
    }
    setOpen(false); setForm(emptyForm); setEditId(null);
  };

  const remove = (id: string) => {
    removeTransaction(id);
    toast.success("Transaction deleted");
  };

  const exportCsv = () => {
    const header = "Date,Tenant,Property,Type,Amount (INR),Status,Note\n";
    const escape = (v: string) => `"${(v ?? "").replace(/"/g, '""')}"`;
    const rows = filtered.map((t) =>
      [t.date, escape(t.tenant), escape(t.property ?? ""), t.type, t.amount, t.status, escape(t.note ?? "")].join(",")
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `transactions-${todayISO()}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported", { description: `${filtered.length} records` });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold">Transactions</h1>
          <p className="text-muted-foreground">Auto rent + manual entries for utilities, maintenance, refunds.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCsv}><Download className="h-4 w-4" /> Export CSV</Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="hero" onClick={openCreate}><Plus className="h-4 w-4" /> Add entry</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editId ? "Edit transaction" : "New transaction"}</DialogTitle></DialogHeader>
              <form onSubmit={submit} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2"><Label>Date</Label><Input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as TransactionType })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Tenant</Label>
                  <Select value={form.tenantId} onValueChange={(v) => setForm({ ...form, tenantId: v })}>
                    <SelectTrigger><SelectValue placeholder="Select tenant (optional)" /></SelectTrigger>
                    <SelectContent>
                      {tenants.map((t) => <SelectItem key={t.id} value={t.id}>{t.name} · {t.room}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2"><Label>Amount (₹)</Label><Input type="number" required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as TransactionStatus })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2"><Label>Note</Label><Input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></div>
                <DialogFooter><Button type="submit" variant="hero">{editId ? "Save" : "Create"}</Button></DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-gradient-card p-4 grid gap-3 md:grid-cols-6">
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
        </div>
        <Select value={propertyFilter} onValueChange={setPropertyFilter}>
          <SelectTrigger><SelectValue placeholder="Property" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All properties</SelectItem>
            {properties.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex gap-2">
          <Input type="number" placeholder="Min ₹" value={minAmount} onChange={(e) => setMinAmount(e.target.value)} />
          <Input type="number" placeholder="Max ₹" value={maxAmount} onChange={(e) => setMaxAmount(e.target.value)} />
        </div>
        <div className="flex gap-2 md:col-span-2">
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <div className="font-display font-semibold">No transactions match</div>
          <div className="text-sm text-muted-foreground">Try clearing filters or add a manual entry.</div>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-gradient-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="text-left p-3">Date</th>
                  <th className="text-left p-3">Tenant</th>
                  <th className="text-left p-3 hidden md:table-cell">Property</th>
                  <th className="text-left p-3">Type</th>
                  <th className="text-left p-3">Amount</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-right p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
                  <tr key={t.id} className="border-t border-border">
                    <td className="p-3 text-muted-foreground">{t.date}</td>
                    <td className="p-3 font-medium">{t.tenant || "—"}</td>
                    <td className="p-3 text-muted-foreground hidden md:table-cell">{t.property ?? "—"}</td>
                    <td className="p-3">{t.type}{t.auto && <span className="ml-2 text-[10px] uppercase text-muted-foreground">auto</span>}</td>
                    <td className={`p-3 font-medium ${t.amount < 0 ? "text-destructive" : ""}`}>{formatINR(t.amount)}</td>
                    <td className="p-3"><Badge variant="outline" className="capitalize">{t.status}</Badge></td>
                    <td className="p-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(t)} title="Edit"><Pencil className="h-4 w-4" /></Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="ghost" title="Delete"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete this transaction?</AlertDialogTitle>
                              <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => remove(t.id)}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
