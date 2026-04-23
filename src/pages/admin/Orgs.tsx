import { useMemo, useState } from "react";
import { useDataStore } from "@/store/DataStore";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import { useCurrency } from "@/hooks/useCurrency";

const PLANS = ["Starter", "Growth", "Scale"];

export default function Orgs() {
  const { data, updateAdminOrgs } = useDataStore();
  const orgs = data.adminOrgs;
  const { fmt, symbol } = useCurrency();

  const [q, setQ] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", owner: "", plan: "Starter", users: "1", mrr: "0" });

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return orgs.filter((o) => {
      if (planFilter !== "all" && o.plan !== planFilter) return false;
      if (s && !`${o.name} ${o.owner}`.toLowerCase().includes(s)) return false;
      return true;
    });
  }, [orgs, q, planFilter]);

  const openCreate = () => { setEditId(null); setForm({ name: "", owner: "", plan: "Starter", users: "1", mrr: "0" }); setOpen(true); };
  const openEdit = (id: string) => {
    const o = orgs.find((x) => x.id === id); if (!o) return;
    setEditId(id);
    setForm({ name: o.name, owner: o.owner, plan: o.plan, users: String(o.users), mrr: String(o.mrr) });
    setOpen(true);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.owner.trim()) {
      toast.error("Missing details"); return;
    }
    const payload = {
      name: form.name.trim(), owner: form.owner.trim(), plan: form.plan,
      users: Math.max(0, Number(form.users) || 0),
      mrr: Math.max(0, Number(form.mrr) || 0),
    };
    if (editId) {
      updateAdminOrgs((list) => list.map((o) => (o.id === editId ? { ...o, ...payload } : o)));
      toast.success("Organization updated");
    } else {
      updateAdminOrgs((list) => [...list, { id: `o${Date.now()}`, ...payload }]);
      toast.success("Organization created");
    }
    setOpen(false);
  };

  const remove = (id: string, n: string) => {
    updateAdminOrgs((list) => list.filter((o) => o.id !== id));
    toast.success("Organization removed", { description: n });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-2xl md:text-3xl font-display font-bold">Organizations</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="hero" onClick={openCreate}><Plus className="h-4 w-4" /> New org</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editId ? "Edit organization" : "New organization"}</DialogTitle></DialogHeader>
            <form onSubmit={submit} className="space-y-3">
              <div className="space-y-2"><Label>Name</Label><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div className="space-y-2"><Label>Owner email</Label><Input type="email" required value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })} /></div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label>Plan</Label>
                  <Select value={form.plan} onValueChange={(v) => setForm({ ...form, plan: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{PLANS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Users</Label><Input type="number" min="0" value={form.users} onChange={(e) => setForm({ ...form, users: e.target.value })} /></div>
                <div className="space-y-2"><Label>MRR ({symbol})</Label><Input type="number" min="0" value={form.mrr} onChange={(e) => setForm({ ...form, mrr: e.target.value })} /></div>
              </div>
              <DialogFooter><Button type="submit" variant="hero">{editId ? "Save" : "Create"}</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search orgs…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
        </div>
        <Select value={planFilter} onValueChange={setPlanFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Plan" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All plans</SelectItem>
            {PLANS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <div className="font-display font-semibold">No organizations</div>
          <div className="text-sm text-muted-foreground">Create your first org to get started.</div>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-gradient-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="text-left p-3">Org</th>
                  <th className="text-left p-3">Owner</th>
                  <th className="text-left p-3">Plan</th>
                  <th className="text-left p-3">Users</th>
                  <th className="text-left p-3">MRR</th>
                  <th className="text-right p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((o) => (
                  <tr key={o.id} className="border-t border-border">
                    <td className="p-3 font-medium">{o.name}</td>
                    <td className="p-3 text-muted-foreground">{o.owner}</td>
                    <td className="p-3"><Badge variant="outline">{o.plan}</Badge></td>
                    <td className="p-3">{o.users}</td>
                    <td className="p-3">{fmt(o.mrr)}</td>
                    <td className="p-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(o.id)}><Pencil className="h-4 w-4" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => remove(o.id, o.name)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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
