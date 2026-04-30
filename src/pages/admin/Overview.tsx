import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Building2, Users, DollarSign, Activity, Clock, AlertCircle, Inbox, LifeBuoy } from "lucide-react";
import { Loader2 } from "lucide-react";

interface Metrics {
  owners: number;
  tenants: number;
  activeSubs: number;
  trialSubs: number;
  expiredSubs: number;
  cancelledSubs: number;
  leads: number;
  openTickets: number;
}

export default function AdminOverview() {
  const [m, setM] = useState<Metrics | null>(null);
  const [recentOwners, setRecentOwners] = useState<number>(0);
  const [mrr, setMrr] = useState<number>(0);

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        const sevenDaysAgo = new Date(Date.now() - 7 * 86400_000).toISOString();

        const [
          owners,
          tenants,
          active,
          trial,
          expired,
          cancelled,
          leads,
          tickets,
          recent,
        ] = await Promise.all([
          supabase.from("user_roles").select("user_id", { count: "exact", head: true }).eq("role", "owner"),
          supabase.from("user_roles").select("user_id", { count: "exact", head: true }).eq("role", "tenant"),
          supabase.from("subscriptions").select("id", { count: "exact", head: true }).eq("status", "active"),
          supabase.from("subscriptions").select("id", { count: "exact", head: true }).eq("status", "trial"),
          supabase.from("subscriptions").select("id", { count: "exact", head: true }).eq("status", "expired"),
          supabase.from("subscriptions").select("id", { count: "exact", head: true }).eq("status", "cancelled"),
          supabase.from("leads").select("id", { count: "exact", head: true }),
          supabase.from("support_tickets").select("id", { count: "exact", head: true }).eq("status", "open"),
          supabase.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", sevenDaysAgo),
        ]);

        setM({
          owners: owners.count ?? 0,
          tenants: tenants.count ?? 0,
          activeSubs: active.count ?? 0,
          trialSubs: trial.count ?? 0,
          expiredSubs: expired.count ?? 0,
          cancelledSubs: cancelled.count ?? 0,
          leads: leads.count ?? 0,
          openTickets: tickets.count ?? 0,
        });

        setRecentOwners(recent.count ?? 0);

        const { data: activeSubsRows } = await supabase
          .from("subscriptions")
          .select("amount")
          .eq("status", "active");

        const totalMrr =
          (activeSubsRows ?? []).reduce((sum, s: any) => sum + (s.amount || 0), 0);

        setMrr(totalMrr);

      } catch (err) {
        console.error("Failed to load admin metrics", err);
      }
    };

    loadMetrics();
  }, []);

  const cards = m
    ? [
        {
          i: Building2,
          l: "Total Owners",
          v: m.owners,
          d: "Number of property owners using the platform",
        },
        {
          i: Users,
          l: "Total Tenants",
          v: m.tenants,
          d: "Total tenants managed across all properties",
        },
        {
          i: DollarSign,
          l: "Active Subscriptions",
          v: m.activeSubs,
          d: "Paying users currently on active plans",
        },
        {
          i: Clock,
          l: "Trial Users",
          v: m.trialSubs,
          d: "Users currently evaluating the platform",
        },
        {
          i: AlertCircle,
          l: "Expired Plans",
          v: m.expiredSubs,
          d: "Users whose subscriptions have ended",
        },
        {
          i: Activity,
          l: "Cancelled Plans",
          v: m.cancelledSubs,
          d: "Users who cancelled their subscriptions",
        },
        {
          i: Inbox,
          l: "New Leads",
          v: m.leads,
          d: "Potential customers awaiting follow-up",
        },
        {
          i: LifeBuoy,
          l: "Open Support Tickets",
          v: m.openTickets,
          d: "Unresolved issues needing attention",
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-display font-bold">Admin overview</h1>
        <p className="text-muted-foreground">Real-time platform metrics from your database.</p>
      </div>

      {m && (
        <>
          {/* KPI Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-lg border border-border p-4">
              <div className="text-xs text-muted-foreground">New Owners (7d)</div>
              <div className="text-lg font-semibold">+{recentOwners}</div>
            </div>

            <div className="rounded-lg border border-border p-4">
              <div className="text-xs text-muted-foreground">Churn (Cancelled)</div>
              <div className="text-lg font-semibold">{m.cancelledSubs}</div>
            </div>

            <div className="rounded-lg border border-border p-4">
              <div className="text-xs text-muted-foreground">Trial Users</div>
              <div className="text-lg font-semibold">{m.trialSubs}</div>
            </div>

            <div className="rounded-lg border border-border p-4">
              <div className="text-xs text-muted-foreground">Open Tickets</div>
              <div className="text-lg font-semibold">{m.openTickets}</div>
            </div>
          </div>

          {/* MRR */}
          <div className="rounded-lg border border-border p-4">
            <div className="text-xs text-muted-foreground">Estimated MRR</div>
            <div className="text-lg font-semibold">₹{mrr.toLocaleString()}</div>
          </div>
        </>
      )}

      {!m ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading metrics…
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((k) => (
            <div key={k.l} className="rounded-xl border border-border bg-gradient-card p-5">
              <k.i className="h-4 w-4 text-primary" />
              <div className="text-xs uppercase tracking-wider text-muted-foreground mt-3">{k.l}</div>
              <div className="text-2xl font-bold font-display mt-1">{k.v}</div>
              <div className="text-xs text-muted-foreground mt-1">{k.d}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
