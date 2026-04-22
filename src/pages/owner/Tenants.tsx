import { useState } from "react";
import { tenants as seed } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PauseCircle, PlayCircle, UserMinus, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type Tenant = typeof seed[number];

export default function Tenants() {
  const [list, setList] = useState<Tenant[]>(seed);
  const [q, setQ] = useState("");

  const filtered = list.filter((t) => `${t.name} ${t.room} ${t.property}`.toLowerCase().includes(q.toLowerCase()));

  const togglePause = (id: string) => {
    setList((prev) => prev.map((t) => t.id === id ? { ...t, status: t.status === "paused" ? "active" : "paused" } : t));
    toast.success("Billing updated");
  };
  const deactivate = (id: string) => {
    setList((prev) => prev.map((t) => t.id === id ? { ...t, status: "deactivated" } : t));
    toast.success("Tenant deactivated", { description: "You can permanently delete after deactivation." });
  };
  const remove = (id: string, n: string) => {
    setList((prev) => prev.filter((t) => t.id !== id));
    toast.success("Tenant deleted", { description: n });
  };

  const statusColor = (s: string) =>
    s === "active" ? "bg-primary/15 text-primary" : s === "paused" ? "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400" : "bg-muted text-muted-foreground";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-display font-bold">Tenants</h1>
        <p className="text-muted-foreground">Pause billing, deactivate, or remove tenants.</p>
      </div>
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search tenants…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
      </div>
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
                const deactivated = t.status === "deactivated";
                return (
                  <tr key={t.id} className="border-t border-border">
                    <td className="p-3 font-medium">{t.name}</td>
                    <td className="p-3 text-muted-foreground hidden md:table-cell">{t.property}</td>
                    <td className="p-3">{t.room}</td>
                    <td className="p-3">${t.rent}</td>
                    <td className="p-3"><Badge className={statusColor(t.status)} variant="outline">{t.status}</Badge></td>
                    <td className="p-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button size="sm" variant="ghost" onClick={() => togglePause(t.id)} disabled={deactivated} title="Pause/resume">
                          {t.status === "paused" ? <PlayCircle className="h-4 w-4" /> : <PauseCircle className="h-4 w-4" />}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => deactivate(t.id)} disabled={deactivated} title="Deactivate">
                          <UserMinus className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="ghost" disabled={!deactivated} title={deactivated ? "Delete" : "Deactivate first"}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete {t.name}?</AlertDialogTitle>
                              <AlertDialogDescription>This permanently removes the tenant and their billing history.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => remove(t.id, t.name)}>Delete</AlertDialogAction>
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
    </div>
  );
}
