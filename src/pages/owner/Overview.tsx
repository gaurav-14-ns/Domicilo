import { useDataStore } from "@/store/DataStore";
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
  const { properties, tenants, transactions } = data;

  const activeTenants = tenants.filter((t) => t.status === "active").length;
  const monthlyRevenue = properties.reduce((s, p) => s + p.revenue, 0);
  const totalUnits = properties.reduce((s, p) => s + p.units, 0);
  const totalOccupied = properties.reduce((s, p) => s + p.occupied, 0);
  const occupancy = totalUnits ? (totalOccupied / totalUnits) * 100 : 0;
  const pendingDues = transactions
    .filter((t) => t.status === "pending")
    .reduce((s, t) => s + Math.max(0, t.amount), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-display font-bold">Welcome back</h1>
        <p className="text-muted-foreground">Here's what's happening across your portfolio.</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={Users} label="Active tenants" value={activeTenants.toLocaleString()} delta="+12.4% MoM" />
        <KpiCard icon={DollarSign} label="Monthly revenue" value={`$${(monthlyRevenue / 1000).toFixed(0)}K`} delta="+8.1% MoM" />
        <KpiCard icon={TrendingUp} label="Occupancy" value={`${occupancy.toFixed(1)}%`} delta="+2.3%" />
        <KpiCard icon={AlertCircle} label="Pending dues" value={`$${pendingDues.toLocaleString()}`} delta="-18%" />
      </div>
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-xl border border-border bg-gradient-card p-5">
          <div className="text-sm font-semibold mb-4">Revenue · last 6 months</div>
          <div className="flex items-end gap-2 h-48">
            {[40, 65, 50, 78, 72, 92].map((h, i) => (
              <div key={i} className="flex-1 rounded-t-md bg-gradient-primary" style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-gradient-card p-5">
          <div className="text-sm font-semibold mb-4">Recent transactions</div>
          <div className="space-y-3">
            {transactions.slice(0, 5).map((t) => (
              <div key={t.id} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground truncate">{t.tenant}</span>
                <span className={`font-medium ${t.amount > 0 ? "text-primary" : "text-destructive"}`}>
                  {t.amount > 0 ? "+" : ""}${t.amount}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="rounded-xl border border-border bg-gradient-card p-5">
        <div className="text-sm font-semibold mb-4">Properties snapshot</div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {properties.map((p) => (
            <div key={p.id} className="rounded-lg border border-border p-4">
              <div className="font-display font-semibold">{p.name}</div>
              <div className="text-xs text-muted-foreground">{p.address}</div>
              <div className="mt-3 text-xs">{p.occupied}/{p.units} occupied</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
