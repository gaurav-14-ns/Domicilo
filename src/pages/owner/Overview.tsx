import { useMemo } from "react";
import { useDataStore } from "@/store/DataStore";
import { useCurrency } from "@/hooks/useCurrency";
import { monthKey, prettyMonth } from "@/lib/format";
import { TrendingUp, Users, DollarSign, AlertCircle } from "lucide-react";

const KpiCard = ({ icon: Icon, label, value, delta }: any) => (
  <div className="rounded-xl border border-border bg-gradient-card p-5">
    <div className="flex items-center justify-between">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <Icon className="h-4 w-4 text-primary" />
    </div>
    <div className="mt-2 text-2xl md:text-3xl font-bold font-display">{value}</div>
    <div className="text-xs text-primary mt-1">{delta}</div>
  </div>
);

export default function OwnerOverview() {
  const { data } = useDataStore();
  const { fmt, fmtCompact } = useCurrency();
  const { properties, tenants, transactions } = data;

  const activeTenants = tenants.filter((t) => t.status === "active").length;
  const monthlyRevenue = properties.reduce((s, p) => s + p.revenue, 0);
  const totalUnits = properties.reduce((s, p) => s + p.units, 0);
  const totalOccupied = properties.reduce((s, p) => s + p.occupied, 0);
  const occupancy = totalUnits ? (totalOccupied / totalUnits) * 100 : 0;
  const pendingDues = transactions
    .filter((t) => t.status === "pending")
    .reduce((s, t) => s + Math.max(0, t.amount), 0);

  const trend = useMemo(() => {
    const now = new Date();
    const months: { key: string; label: string; total: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = monthKey(d);
      months.push({ key, label: prettyMonth(key), total: 0 });
    }
    for (const t of transactions) {
      if (t.status !== "completed") continue;
      const k = monthKey(t.date);
      const slot = months.find((m) => m.key === k);
      if (slot) slot.total += Math.max(0, t.amount);
    }
    return months;
  }, [transactions]);
  const trendMax = Math.max(1, ...trend.map((m) => m.total));
  const hasTrendData = trend.some((m) => m.total > 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-display font-bold">Welcome back</h1>
        <p className="text-muted-foreground">Here's what's happening across your portfolio.</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={Users} label="Active tenants" value={activeTenants.toLocaleString()} delta="Live" />
        <KpiCard icon={DollarSign} label="Monthly revenue" value={fmtCompact(monthlyRevenue)} delta="Live" />
        <KpiCard icon={TrendingUp} label="Occupancy" value={`${occupancy.toFixed(1)}%`} delta="Live" />
        <KpiCard icon={AlertCircle} label="Pending dues" value={fmt(pendingDues)} delta="Live" />
      </div>
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-xl border border-border bg-gradient-card p-5">
          <div className="text-sm font-semibold mb-4">Revenue · last 6 months</div>
          {hasTrendData ? (
            <div className="flex items-end gap-2 h-48">
              {trend.map((m) => (
                <div key={m.key} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full rounded-t-md bg-gradient-primary" style={{ height: `${(m.total / trendMax) * 100}%`, minHeight: 2 }} title={fmt(m.total)} />
                  <div className="text-[10px] text-muted-foreground">{m.label.slice(0, 3)}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-48 grid place-items-center text-center">
              <div>
                <div className="font-display font-semibold">Not enough historical data yet.</div>
                <div className="text-xs text-muted-foreground mt-1">Once tenants start paying, your trend will appear here.</div>
              </div>
            </div>
          )}
        </div>
        <div className="rounded-xl border border-border bg-gradient-card p-5">
          <div className="text-sm font-semibold mb-4">Recent transactions</div>
          {transactions.length === 0 ? (
            <div className="text-sm text-muted-foreground">No activity yet.</div>
          ) : (
            <div className="space-y-3">
              {transactions.slice(0, 5).map((t) => (
                <div key={t.id} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground truncate">{t.tenant || t.type}</span>
                  <span className={`font-medium ${t.amount > 0 ? "text-primary" : "text-destructive"}`}>
                    {fmt(t.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="rounded-xl border border-border bg-gradient-card p-5">
        <div className="text-sm font-semibold mb-4">Properties snapshot</div>
        {properties.length === 0 ? (
          <div className="text-sm text-muted-foreground">Add your first property to get started.</div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {properties.map((p) => (
              <div key={p.id} className="rounded-lg border border-border p-4">
                <div className="font-display font-semibold">{p.name}</div>
                <div className="text-xs text-muted-foreground">{p.address}</div>
                <div className="mt-3 text-xs">{p.occupied}/{p.units} occupied</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
