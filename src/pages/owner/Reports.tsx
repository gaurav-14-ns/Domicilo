import { useMemo } from "react";
import { useDataStore } from "@/store/DataStore";
import { useCurrency } from "@/hooks/useCurrency";
import { monthKey, prettyMonth } from "@/lib/format";

export default function Reports() {
  const { data } = useDataStore();
  const { fmt } = useCurrency();
  const { properties, tenants, transactions } = data;

  const totalRevenue = properties.reduce((s, p) => s + p.revenue, 0);
  const totalUnits = properties.reduce((s, p) => s + p.units, 0);
  const totalOccupied = properties.reduce((s, p) => s + p.occupied, 0);
  const vacantUnits = Math.max(0, totalUnits - totalOccupied);
  const activeTenants = tenants.filter((t) => t.status === "active" || t.status === "paused").length;
  const dues = transactions
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-display font-bold">Reports</h1>
        <p className="text-muted-foreground">Live performance across your portfolio.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { l: "Total revenue", v: fmt(totalRevenue) },
          { l: "Active tenants", v: activeTenants.toLocaleString() },
          { l: "Total units", v: totalUnits },
          { l: "Vacant units", v: vacantUnits },
          { l: "Pending dues", v: fmt(dues) },
        ].map((k) => (
          <div key={k.l} className="rounded-xl border border-border bg-gradient-card p-5">
            <div className="text-xs uppercase text-muted-foreground">{k.l}</div>
            <div className="text-2xl font-bold font-display mt-1">{k.v}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-gradient-card p-5">
          <div className="text-sm font-semibold mb-4">Revenue by property</div>
          {properties.length === 0 ? (
            <div className="text-sm text-muted-foreground">No properties yet.</div>
          ) : (
            <div className="space-y-3">
              {properties.map((p) => {
                const pct = totalRevenue ? (p.revenue / totalRevenue) * 100 : 0;
                return (
                  <div key={p.id}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{p.name}</span>
                      <span className="text-muted-foreground">{fmt(p.revenue)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-gradient-primary" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-border bg-gradient-card p-5">
          <div className="text-sm font-semibold mb-4">Monthly revenue · last 6 months</div>
          <div className="flex items-end gap-2 h-48">
            {trend.map((m) => (
              <div key={m.key} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full rounded-t-md bg-gradient-primary" style={{ height: `${(m.total / trendMax) * 100}%`, minHeight: 2 }} />
                <div className="text-[10px] text-muted-foreground">{m.label.slice(0, 3)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-gradient-card p-5">
        <div className="text-sm font-semibold mb-4">Property-wise occupancy</div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {properties.map((p) => {
            const occ = p.units ? (p.occupied / p.units) * 100 : 0;
            return (
              <div key={p.id} className="rounded-lg border border-border p-4">
                <div className="font-display font-semibold">{p.name}</div>
                <div className="text-xs text-muted-foreground">{p.address}</div>
                <div className="mt-3 flex justify-between text-xs"><span>{p.occupied}/{p.units} occupied</span><span className="text-primary font-medium">{occ.toFixed(0)}%</span></div>
                <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-gradient-primary" style={{ width: `${occ}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
