import { useAuth } from "@/hooks/useAuth";
import { useDataStore } from "@/store/DataStore";
import { Wallet, Receipt, CalendarCheck } from "lucide-react";

export default function TenantOverview() {
  const { user } = useAuth();
  const { data } = useDataStore();
  const transactions = data.transactions;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-display font-bold">Welcome, {user?.email?.split("@")[0]}</h1>
        <p className="text-muted-foreground">Your home, your dues, your schedule.</p>
      </div>
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { icon: Wallet, label: "Outstanding dues", value: "$1,200", note: "Due May 1" },
          { icon: Receipt, label: "Last payment", value: "$1,200", note: "Apr 1, 2026" },
          { icon: CalendarCheck, label: "Lease ends", value: "Dec 2026", note: "8 months" },
        ].map((k) => (
          <div key={k.label} className="rounded-xl border border-border bg-gradient-card p-5">
            <k.icon className="h-5 w-5 text-primary" />
            <div className="text-xs uppercase tracking-wider text-muted-foreground mt-3">{k.label}</div>
            <div className="text-2xl font-bold font-display mt-1">{k.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{k.note}</div>
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-border bg-gradient-card p-5">
        <div className="text-sm font-semibold mb-3">Recent activity</div>
        <div className="space-y-2 text-sm">
          {transactions.slice(0, 4).map((t) => (
            <div key={t.id} className="flex justify-between border-t border-border pt-2">
              <span className="text-muted-foreground">{t.date} · {t.type}</span>
              <span className="font-medium">${t.amount}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
