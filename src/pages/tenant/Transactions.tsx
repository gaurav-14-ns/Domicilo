import { useAuth } from "@/hooks/useAuth";
import { useDataStore } from "@/store/DataStore";
import { useCurrentTenant, useTenantTransactions } from "@/hooks/useTenantData";
import { Badge } from "@/components/ui/badge";
import { formatINR } from "@/lib/format";

export default function TenantTransactions() {
  const { user } = useAuth();
  const { data } = useDataStore();
  const tenant = useCurrentTenant(data.tenants, user?.email);
  const txs = useTenantTransactions(data.transactions, tenant?.id);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl md:text-3xl font-display font-bold">My transactions</h1>
      {txs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <div className="font-display font-semibold">No transactions yet</div>
          <div className="text-sm text-muted-foreground">Payments and charges will appear here.</div>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-gradient-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr><th className="text-left p-3">Date</th><th className="text-left p-3">Type</th><th className="text-left p-3">Amount</th><th className="text-left p-3">Status</th></tr>
            </thead>
            <tbody>
              {txs.map((t) => (
                <tr key={t.id} className="border-t border-border">
                  <td className="p-3 text-muted-foreground">{t.date}</td>
                  <td className="p-3">{t.type}</td>
                  <td className="p-3 font-medium">{formatINR(t.amount)}</td>
                  <td className="p-3"><Badge variant="outline" className="capitalize">{t.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
