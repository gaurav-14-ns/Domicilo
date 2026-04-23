import { useAuth } from "@/hooks/useAuth";
import { useDataStore } from "@/store/DataStore";
import { useCurrency } from "@/hooks/useCurrency";
import { useCurrentTenant, useTenantDues, useTenantTransactions } from "@/hooks/useTenantData";
import { Wallet, Receipt, CalendarCheck } from "lucide-react";

export default function TenantOverview() {
  const { user } = useAuth();
  const { data } = useDataStore();
  const { fmt } = useCurrency();
  const tenant = useCurrentTenant(data.tenants, user?.email);
  const txs = useTenantTransactions(data.transactions, tenant?.id);
  const outstanding = useTenantDues(data.transactions, tenant?.id);
  const lastPayment = txs.find((t) => t.status === "completed");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-display font-bold">
          Welcome, {tenant?.name ?? user?.email?.split("@")[0]}
        </h1>
        <p className="text-muted-foreground">
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
                <span className="font-medium">{fmt(t.amount)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
