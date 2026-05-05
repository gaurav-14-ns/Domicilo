import { Download } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { downloadCSV, monthKey, prettyMonth } from "@/lib/format";

export default function Reports() {  
  const { data } = useDataStore();
  const { fmt } = useCurrency();
  const { canUseAdvancedReports, planLabel } = usePlanLimits();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const { properties, tenants, transactions } = data;
  const [propertyFilter, setPropertyFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

  <div className="rounded-xl border border-border bg-gradient-card p-4 flex flex-wrap gap-3 items-end">
  <div className="space-y-1">
    <label className="text-xs text-muted-foreground">Property</label>
    <Select value={propertyFilter} onValueChange={setPropertyFilter}>
      <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All properties</SelectItem>
        {properties.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
      </SelectContent>
    </Select>
  </div>
  <div className="space-y-1">
    <label className="text-xs text-muted-foreground">Status</label>
    <Select value={statusFilter} onValueChange={setStatusFilter}>
      <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All</SelectItem>
        <SelectItem value="completed">Completed</SelectItem>
        <SelectItem value="pending">Pending</SelectItem>
        <SelectItem value="failed">Failed</SelectItem>
      </SelectContent>
    </Select>
  </div>
  <div className="space-y-1">
    <label className="text-xs text-muted-foreground">From</label>
    <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="w-40" />
  </div>
  <div className="space-y-1">
    <label className="text-xs text-muted-foreground">To</label>
    <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="w-40" />
  </div>
  <Button
    variant="outline"
    size="sm"
    onClick={() => downloadCSV(trend.map((m) => ({ month: m.label, revenue: m.total })), "monthly-revenue")}
  >
    <Download className="h-4 w-4" /> Export CSV
  </Button>
  </div>
  
  const filteredTx = useMemo(() => {
    return transactions.filter((t) => {
      if (propertyFilter !== "all" && t.propertyId !== propertyFilter) return false;
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      const ts = new Date(t.date).getTime();
      if (fromDate && ts < new Date(fromDate).getTime()) return false;
      if (toDate && ts > new Date(toDate).getTime() + 86_400_000) return false;
      return true;
    });
  }, [transactions, propertyFilter, statusFilter, fromDate, toDate]);

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
    for (const t of filteredTx) {
      if (t.status !== "completed") continue;
      const k = monthKey(t.date);
      const slot = months.find((m) => m.key === k);
      if (slot) slot.total += Math.max(0, t.amount);
    }
    return months;
  }, [filteredTx]);

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

      {canUseAdvancedReports ? (
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
            {trend.every((m) => m.total === 0) ? (
              <div className="h-48 grid place-items-center text-center text-sm text-muted-foreground">
                Not enough historical data yet.<br />Charts populate as transactions are recorded.
              </div>
            ) : (
              <div className="flex items-end gap-2 h-48">
                {trend.map((m) => (
                  <div key={m.key} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full rounded-t-md bg-gradient-primary" style={{ height: `${(m.total / trendMax) * 100}%`, minHeight: 2 }} />
                    <div className="text-[10px] text-muted-foreground">{m.label.slice(0, 3)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-primary/40 bg-primary/5 p-8 text-center space-y-3">
          <div className="mx-auto h-10 w-10 rounded-full bg-primary/10 grid place-items-center">
            <Lock className="h-5 w-5 text-primary" />
          </div>
          <div className="font-display font-semibold">Advanced reports are on Growth & Scale</div>
          <div className="text-sm text-muted-foreground">
            Your {planLabel} plan shows top-line metrics. Upgrade to unlock revenue charts, exports, and trend analysis.
          </div>
          <Button variant="hero" onClick={() => setUpgradeOpen(true)}>
            <Sparkles className="h-4 w-4" /> Upgrade plan
          </Button>
        </div>
      )}
      <UpgradeDialog open={upgradeOpen} onOpenChange={setUpgradeOpen} reason={`Advanced reports require Growth or Scale.`} />

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
