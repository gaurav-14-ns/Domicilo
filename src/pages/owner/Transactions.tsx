import { useState } from "react";
import { transactions } from "@/lib/mockData";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Search } from "lucide-react";
import { toast } from "sonner";

export default function Transactions() {
  const [q, setQ] = useState("");
  const filtered = transactions.filter((t) => `${t.tenant} ${t.type}`.toLowerCase().includes(q.toLowerCase()));

  const exportCsv = () => {
    const header = "Date,Tenant,Type,Amount,Status\n";
    const rows = filtered.map((t) => `${t.date},${t.tenant},${t.type},${t.amount},${t.status}`).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "transactions.csv"; a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold">Transactions</h1>
          <p className="text-muted-foreground">All rent, utilities, and adjustments.</p>
        </div>
        <Button variant="outline" onClick={exportCsv}><Download className="h-4 w-4" /> Export CSV</Button>
      </div>
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
      </div>
      <div className="rounded-xl border border-border bg-gradient-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left p-3">Date</th>
                <th className="text-left p-3">Tenant</th>
                <th className="text-left p-3">Type</th>
                <th className="text-left p-3">Amount</th>
                <th className="text-left p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id} className="border-t border-border">
                  <td className="p-3 text-muted-foreground">{t.date}</td>
                  <td className="p-3 font-medium">{t.tenant}</td>
                  <td className="p-3">{t.type}</td>
                  <td className={`p-3 font-medium ${t.amount < 0 ? "text-destructive" : ""}`}>${t.amount}</td>
                  <td className="p-3"><Badge variant="outline" className="capitalize">{t.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
