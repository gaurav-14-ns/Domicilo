import { useEffect, useMemo, useState } from "react";

import { supabase } from "@/integrations/supabase/client";

import {
  Building2,
  IndianRupee,
  Users,
  Inbox,
  TrendingUp,
  AlertCircle,
  Ban,
  Home,
  Loader2,
} from "lucide-react";

interface Metrics {
  activeOwners: number;
  monthlyRevenue: number;
  activeTenants: number;
  openLeads: number;
  conversionRate: number;
  suspendedAccounts: number;
  churnedSubscriptions: number;
  totalProperties: number;
}

export default function AdminOverview() {
  const [loading, setLoading] = useState(true);

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [metrics, setMetrics] = useState<Metrics>({
    activeOwners: 0,
    monthlyRevenue: 0,
    activeTenants: 0,
    openLeads: 0,
    conversionRate: 0,
    suspendedAccounts: 0,
    churnedSubscriptions: 0,
    totalProperties: 0,
  });

  const resetFilters = () => {
    setFromDate("");
    setToDate("");
  };

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        setLoading(true);

        const applyDateFilter = (query: any) => {
          if (fromDate) {
            query = query.gte("created_at", fromDate);
          }

          if (toDate) {
            query = query.lte("created_at", `${toDate}T23:59:59`);
          }

          return query;
        };

        // =====================================================
        // ACTIVE OWNERS
        // =====================================================
        // FINAL BUSINESS LOGIC:
        // role = owner
        // status != suspended
        // has ANY subscription row
        // =====================================================

        let profilesQuery = supabase
          .from("profiles")
          .select(`
            id,
            status,
            created_at
          `);

        let userRolesQuery = supabase
          .from("user_roles")
          .select(`
            user_id,
            role,
            created_at
          `)
          .eq("role", "owner");

        let subscriptionsQuery = supabase
          .from("subscriptions")
          .select(`
            owner_id,
            plan,
            status,
            created_at
          `);

        // =====================================================
        // ACTIVE SUBSCRIPTIONS / MRR
        // =====================================================

        let activeSubscriptionsQuery = supabase
          .from("subscriptions")
          .select(`
            id,
            amount,
            status,
            created_at
          `)
          .eq("status", "active");

        // =====================================================
        // ACTIVE TENANTS
        // =====================================================

        let activeTenantsQuery = supabase
          .from("tenants")
          .select(`
            id,
            status,
            created_at
          `)
          .neq("status", "moved_out");

        // =====================================================
        // OPEN LEADS
        // =====================================================

        let openLeadsQuery = supabase
          .from("leads")
          .select(`
            id,
            status,
            created_at
          `)
          .neq("status", "closed");

        // =====================================================
        // SUSPENDED ACCOUNTS
        // =====================================================

        let suspendedAccountsQuery = supabase
          .from("profiles")
          .select(`
            id,
            status,
            created_at
          `)
          .eq("status", "suspended");

        // =====================================================
        // CHURNED SUBSCRIPTIONS
        // =====================================================

        let churnedSubscriptionsQuery = supabase
          .from("subscriptions")
          .select(`
            id,
            status,
            created_at
          `)
          .eq("status", "cancelled");

        // =====================================================
        // TOTAL PROPERTIES
        // =====================================================

        let totalPropertiesQuery = supabase
          .from("properties")
          .select(`
            id,
            created_at
          `);

        // =====================================================
        // CONVERSION
        // =====================================================

        let conversionBaseQuery = supabase
          .from("subscriptions")
          .select(`
            owner_id,
            status,
            trial_end,
            created_at
          `);

        // =====================================================
        // APPLY FILTERS
        // =====================================================

        profilesQuery = applyDateFilter(profilesQuery);
        userRolesQuery = applyDateFilter(userRolesQuery);
        subscriptionsQuery = applyDateFilter(subscriptionsQuery);

        activeSubscriptionsQuery = applyDateFilter(activeSubscriptionsQuery);
        activeTenantsQuery = applyDateFilter(activeTenantsQuery);
        openLeadsQuery = applyDateFilter(openLeadsQuery);
        suspendedAccountsQuery = applyDateFilter(suspendedAccountsQuery);
        churnedSubscriptionsQuery = applyDateFilter(churnedSubscriptionsQuery);
        totalPropertiesQuery = applyDateFilter(totalPropertiesQuery);
        conversionBaseQuery = applyDateFilter(conversionBaseQuery);

        // =====================================================
        // FETCH
        // =====================================================

        const [
          profilesResult,
          userRolesResult,
          subscriptionsResult,
          activeSubscriptionsResult,
          activeTenantsResult,
          openLeadsResult,
          suspendedAccountsResult,
          churnedSubscriptionsResult,
          totalPropertiesResult,
          conversionBaseResult,
        ] = await Promise.all([
          profilesQuery,
          userRolesQuery,
          subscriptionsQuery,
          activeSubscriptionsQuery,
          activeTenantsQuery,
          openLeadsQuery,
          suspendedAccountsQuery,
          churnedSubscriptionsQuery,
          totalPropertiesQuery,
          conversionBaseQuery,
        ]);

        const profiles = profilesResult.data || [];
        const userRoles = userRolesResult.data || [];
        const subscriptions = subscriptionsResult.data || [];

        const activeSubscriptions =
          activeSubscriptionsResult.data || [];

        const activeTenants =
          activeTenantsResult.data || [];

        const openLeads =
          openLeadsResult.data || [];

        const suspendedAccounts =
          suspendedAccountsResult.data || [];

        const churnedSubscriptions =
          churnedSubscriptionsResult.data || [];

        const totalProperties =
          totalPropertiesResult.data || [];

        const conversionBase =
          conversionBaseResult.data || [];

        // =====================================================
        // ACTIVE OWNERS FINAL FIX
        // =====================================================

        const ownerIds = new Set(
          userRoles
            .filter((r: any) => r.role === "owner")
            .map((r: any) => r.user_id)
        );

        const subscribedOwnerIds = new Set(
          subscriptions
            .filter((s: any) =>
              ["trial", "active", "cancelled"].includes(s.status)
            )
            .map((s: any) => s.owner_id)
        );

        const activeOwners = profiles.filter((profile: any) => {
          const isOwner = ownerIds.has(profile.id);

          const hasSubscription = subscribedOwnerIds.has(profile.id);

          const isNotSuspended =
            profile.status !== "suspended";

          return (
            isOwner &&
            hasSubscription &&
            isNotSuspended
          );
        });

        // =====================================================
        // MRR
        // =====================================================

        const monthlyRevenue = activeSubscriptions.reduce(
          (total: number, sub: any) =>
            total + Number(sub.amount || 0),
          0
        );

        // =====================================================
        // CONVERSION RATE
        // =====================================================

        const trialStartedOwners = conversionBase.filter(
          (sub: any) => sub.trial_end
        );

        const convertedOwners = conversionBase.filter(
          (sub: any) => sub.status === "active"
        );

        const uniqueTrialOwners = new Set(
          trialStartedOwners.map((sub: any) => sub.owner_id)
        );

        const uniqueConvertedOwners = new Set(
          convertedOwners.map((sub: any) => sub.owner_id)
        );

        const conversionRate =
          uniqueTrialOwners.size === 0
            ? 0
            : Number(
                (
                  (uniqueConvertedOwners.size /
                    uniqueTrialOwners.size) *
                  100
                ).toFixed(1)
              );

        // =====================================================
        // FINAL METRICS
        // =====================================================

        setMetrics({
          activeOwners: activeOwners.length,

          monthlyRevenue,

          activeTenants: activeTenants.length,

          openLeads: openLeads.length,

          conversionRate,

          suspendedAccounts: suspendedAccounts.length,

          churnedSubscriptions:
            churnedSubscriptions.length,

          totalProperties:
            totalProperties.length,
        });
      } catch (error) {
        console.error(
          "Overview metrics failed:",
          error
        );
      } finally {
        setLoading(false);
      }
    };

    loadMetrics();
  }, [fromDate, toDate]);

  const cards = useMemo(
    () => [
      {
        icon: Building2,
        label: "Active Owners",
        value: metrics.activeOwners,
        description:
          "Owners currently active",
      },

      {
        icon: IndianRupee,
        label: "Monthly Revenue",
        value: `₹${metrics.monthlyRevenue.toLocaleString(
          "en-IN"
        )}`,
        description:
          "Revenue from active subscriptions",
      },

      {
        icon: Users,
        label: "Active Tenants",
        value: metrics.activeTenants,
        description:
          "Tenants currently active",
      },

      {
        icon: Inbox,
        label: "Open Leads",
        value: metrics.openLeads,
        description:
          "Leads awaiting closure",
      },

      {
        icon: TrendingUp,
        label: "Conversion Rate",
        value: `${metrics.conversionRate}%`,
        description:
          "Trial to paid conversion",
      },

      {
        icon: AlertCircle,
        label: "Suspended Accounts",
        value: metrics.suspendedAccounts,
        description:
          "Suspended owners & tenants",
      },

      {
        icon: Ban,
        label: "Churned Subscriptions",
        value: metrics.churnedSubscriptions,
        description:
          "Cancelled subscriptions",
      },

      {
        icon: Home,
        label: "Total Properties",
        value: metrics.totalProperties,
        description:
          "Properties onboarded",
      },
    ],
    [metrics]
  );

  return (
    <div className="space-y-6 w-full overflow-hidden">
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-display font-bold tracking-tight">
          Admin Overview
        </h1>

        <p className="text-sm text-muted-foreground">
          Real-time platform intelligence and operational insights.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card/40 backdrop-blur-sm p-4 md:p-5 space-y-4">
        <div className="text-sm font-medium">
          Filters
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">
              From (Date)
            </div>

            <input
              type="date"
              value={fromDate}
              onChange={(e) =>
                setFromDate(e.target.value)
              }
              className="h-11 w-full rounded-xl border border-border bg-background px-4 outline-none transition-all focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">
              To (Date)
            </div>

            <input
              type="date"
              value={toDate}
              onChange={(e) =>
                setToDate(e.target.value)
              }
              className="h-11 w-full rounded-xl border border-border bg-background px-4 outline-none transition-all focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="space-y-2">
            <div className="text-xs text-transparent">
              Reset
            </div>

            <button
              onClick={resetFilters}
              className="h-11 w-full rounded-xl border border-border bg-background px-4 font-medium transition-all hover:bg-muted/40 hover:border-primary/30"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground py-10">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading overview metrics...
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {cards.map((card) => (
            <div
              key={card.label}
              className="group relative overflow-hidden rounded-2xl border border-border bg-gradient-card p-5 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-2xl min-h-[170px]"
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-primary/5 pointer-events-none" />

              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                <card.icon className="h-5 w-5 text-primary" />
              </div>

              <div className="mt-5 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                {card.label}
              </div>

              <div className="mt-3 text-3xl md:text-4xl font-bold tracking-tight break-words">
                {card.value}
              </div>

              <div className="mt-3 text-sm text-muted-foreground leading-relaxed">
                {card.description}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
