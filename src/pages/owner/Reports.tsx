import { properties } from "@/lib/mockData";

export default function Reports() {
  const totalRevenue = properties.reduce((s, p) => s + p.revenue, 0);
  const totalUnits = properties.reduce((s, p) => s + p.units, 0);
  const totalOccupied = properties.reduce((s, p) => s + p.occupied, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-display font-bold">Reports</h1>
        <p className="text-muted-foreground">Portfolio performance at a glance.</p>
      </div>
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-gradient-card p-5">
          <div className="text-xs uppercase text-muted-foreground">Total revenue</div>
          <div className="text-2xl font-bold font-display mt-1">${totalRevenue.toLocaleString()}</div>
        </div>
        <div className="rounded-xl border border-border bg-gradient-card p-5">
          <div className="text-xs uppercase text-muted-foreground">Total units</div>
          <div className="text-2xl font-bold font-display mt-1">{totalUnits}</div>
        </div>
        <div className="rounded-xl border border-border bg-gradient-card p-5">
          <div className="text-xs uppercase text-muted-foreground">Occupancy</div>
          <div className="text-2xl font-bold font-display mt-1">{((totalOccupied / totalUnits) * 100).toFixed(1)}%</div>
        </div>
      </div>
      <div className="rounded-xl border border-border bg-gradient-card p-5">
        <div className="text-sm font-semibold mb-4">Revenue by property</div>
        <div className="space-y-3">
          {properties.map((p) => {
            const pct = (p.revenue / totalRevenue) * 100;
            return (
              <div key={p.id}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{p.name}</span>
                  <span className="text-muted-foreground">${p.revenue.toLocaleString()}</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-gradient-primary" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
