import { useAuth } from "@/hooks/useAuth";
import { useDataStore } from "@/store/DataStore";
import { useCurrentTenant, useTenantDues, useTenantTransactions } from "@/hooks/useTenantData";
import { formatMoney } from "@/lib/currency";
import { Wallet, Receipt, CalendarCheck } from "lucide-react";
import { LoadingState } from "@/components/states/LoadingState";
import { ErrorState } from "@/components/states/ErrorState";

export default function TenantOverview() {
  const { user } = useAuth();
  const { data, loading, error, refresh } = useDataStore();
  const tenant = useCurrentTenant(data?.tenants ?? [], user?.email);
  const txs = useTenantTransactions(data?.transactions ?? [], tenant?.id);
  const outstanding = useTenantDues(data?.transactions ?? [], tenant?.id);
  const lastPayment = [...txs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).find((t) => t.status === "completed");
  const fmt = (amount: number) => formatMoney(amount);

  if (error) return <ErrorState title="Failed to load overview" description={error} onRetry={refresh} />;
  if (loading) return <LoadingState title="Loading overview..." />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-display font-bold text-gradient">
          Welcome, {tenant?.name ?? user?.email?.split("@")[0]}
        </h1>
        <p className="text-muted-foreground font-alt tracking-wide">
          {tenant ? `${tenant.property} · Room ${tenant.room}` : "Your home, your dues, your schedule."}
        </p>
      </div>
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { icon: Wallet, label: "Outstanding dues", value: fmt(outstanding), note: outstanding > 0 ? "Due this month" : "All clear" },
          { icon: Receipt, label: "Last payment", value: lastPayment ? fmt(lastPayment.amount) : "—", note: lastPayment?.date ?? "No payments yet" },
          { icon: CalendarCheck, label: "Tenant since", value: tenant?.startDate ?? "—", note: tenant?.status ?? "" },
        ].map((k) => (
          <div key={k.label} className="rounded-xl border border-border bg-gradient-card p-5">
            <k.icon className="h-5 w-5 text-primary" />
            <div className="text-xs uppercase tracking-wider text-muted-foreground mt-3">{k.label}</div>
            <div className="text-2xl font-bold font-display mt-1">{k.value}</div>
            <div className="text-xs text-muted-foreground mt-1 capitalize">{k.note}</div>
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-border bg-gradient-card p-5">
        <div className="text-sm font-semibold mb-3">Recent activity</div>
        {txs.length === 0 ? (
          <div className="text-sm text-muted-foreground">No activity yet.</div>
        ) : (
          <div className="space-y-2 text-sm">
            {txs.slice(0, 5).map((t) => (
              <div key={t.id} className="flex justify-between border-t border-border pt-2">
                <span className="text-muted-foreground">{t.date} · {t.type}</span>
                <span className="font-medium">
                  {formatMoney(t.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
