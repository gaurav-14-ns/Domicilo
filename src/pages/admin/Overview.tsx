import { useDataStore } from "@/store/DataStore";
import { useCurrency } from "@/hooks/useCurrency";
import { Building2, Users, DollarSign, Activity } from "lucide-react";

export default function AdminOverview() {
  const { data } = useDataStore();
  const { fmt } = useCurrency();
  const adminOrgs = data.adminOrgs;
  const totalMrr = adminOrgs.reduce((s, o) => s + o.mrr, 0);
  const totalUsers = adminOrgs.reduce((s, o) => s + o.users, 0);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-display font-bold">Admin overview</h1>
        <p className="text-muted-foreground">Platform-wide metrics.</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { i: Building2, l: "Organizations", v: adminOrgs.length },
          { i: Users, l: "Total users", v: totalUsers },
          { i: DollarSign, l: "MRR", v: fmt(totalMrr) },
          { i: Activity, l: "System health", v: "99.98%" },
        ].map((k) => (
          <div key={k.l} className="rounded-xl border border-border bg-gradient-card p-5">
            <k.i className="h-4 w-4 text-primary" />
            <div className="text-xs uppercase tracking-wider text-muted-foreground mt-3">{k.l}</div>
            <div className="text-2xl font-bold font-display mt-1">{k.v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
