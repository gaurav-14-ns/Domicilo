import { transactions as seed } from "@/lib/mockData";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { Badge } from "@/components/ui/badge";

export default function TenantTransactions() {
  const [transactions] = useLocalStorage("domicilo:transactions", seed);
  return (
    <div className="space-y-6">
      <h1 className="text-2xl md:text-3xl font-display font-bold">My transactions</h1>
      <div className="rounded-xl border border-border bg-gradient-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
            <tr><th className="text-left p-3">Date</th><th className="text-left p-3">Type</th><th className="text-left p-3">Amount</th><th className="text-left p-3">Status</th></tr>
          </thead>
          <tbody>
            {transactions.map((t) => (
              <tr key={t.id} className="border-t border-border">
                <td className="p-3 text-muted-foreground">{t.date}</td>
                <td className="p-3">{t.type}</td>
                <td className="p-3 font-medium">${t.amount}</td>
                <td className="p-3"><Badge variant="outline" className="capitalize">{t.status}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
