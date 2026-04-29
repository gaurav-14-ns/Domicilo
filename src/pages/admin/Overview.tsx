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

  useEffect(() => {
    (async () => {
      const [owners, tenants, active, trial, expired, cancelled, leads, tickets] = await Promise.all([
        supabase.from("user_roles").select("user_id", { count: "exact", head: true }).eq("role", "owner"),
        supabase.from("user_roles").select("user_id", { count: "exact", head: true }).eq("role", "tenant"),
        supabase.from("subscriptions").select("id", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("subscriptions").select("id", { count: "exact", head: true }).eq("status", "trial"),
        supabase.from("subscriptions").select("id", { count: "exact", head: true }).eq("status", "expired"),
        supabase.from("subscriptions").select("id", { count: "exact", head: true }).eq("status", "cancelled"),
        supabase.from("leads").select("id", { count: "exact", head: true }),
        supabase.from("support_tickets").select("id", { count: "exact", head: true }).eq("status", "open"),
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
    })();
  }, []);

  const cards = m
    ? [
        { i: Building2, l: "Total owners", v: m.owners },
        { i: Users, l: "Total tenants", v: m.tenants },
        { i: DollarSign, l: "Active subscriptions", v: m.activeSubs },
        { i: Clock, l: "Trial users", v: m.trialSubs },
        { i: AlertCircle, l: "Expired", v: m.expiredSubs },
        { i: Activity, l: "Cancelled", v: m.cancelledSubs },
        { i: Inbox, l: "Leads", v: m.leads },
        { i: LifeBuoy, l: "Open tickets", v: m.openTickets },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-display font-bold">Admin overview</h1>
        <p className="text-muted-foreground">Real-time platform metrics from your database.</p>
      </div>
      {!m ? (
        <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading metrics…</div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((k) => (
            <div key={k.l} className="rounded-xl border border-border bg-gradient-card p-5">
              <k.i className="h-4 w-4 text-primary" />
              <div className="text-xs uppercase tracking-wider text-muted-foreground mt-3">{k.l}</div>
              <div className="text-2xl font-bold font-display mt-1">{k.v}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
