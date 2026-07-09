import { useMemo, useState } from "react";
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useDataStore } from "@/store/DataStore";
import { useCurrency } from "@/hooks/useCurrency";
import { useAuth } from "@/hooks/useAuth";
import { LoadingState } from "@/components/states/LoadingState";
import { ErrorState } from "@/components/states/ErrorState";
import { monthKey, prettyMonth } from "@/lib/format";
import { TrendingUp, Users, DollarSign, AlertCircle } from "lucide-react";

const KpiCard = ({
  icon: Icon,
  label,
  value,
  delta,
}: any) => (
  <div className="group rounded-xl border border-border bg-gradient-card p-5 transition-smooth hover:-translate-y-1 hover:border-primary/30 hover:shadow-elegant">
    <div className="flex items-center justify-between">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </div>

      <Icon className="h-4 w-4 text-primary transition-smooth group-hover:scale-110" />
    </div>

    <div className="mt-2 text-2xl md:text-3xl font-bold font-display text-gold">
      {value}
    </div>

    <div className="text-xs text-primary mt-1 font-alt">
      {delta}
    </div>
  </div>
);

export default function OwnerOverview() {
  const { user } = useAuth();
  const { data, loading, error, refresh } =
    useDataStore();
  const displayName = data?.settings?.displayName || user?.email?.split("@")[0];

  const {
    fmt,
    fmtCompact,
  } = useCurrency();

  const properties =
    useMemo(() =>
      Array.isArray(
        data?.properties
      )
        ? data.properties
        : [],
    [data?.properties]
    );

  const tenants =
    useMemo(() =>
      Array.isArray(
        data?.tenants
      )
        ? data.tenants
        : [],
    [data?.tenants]
    );

  const transactions =
    useMemo(() =>
      data?.transactions ??
      [],
    [data?.transactions]
    );

  const activeTenants =
  useMemo(() =>
    tenants.filter(
      (t) =>
        t?.status ===
        "active"
    ).length,
  [tenants]
  );

  const monthlyRevenue =
  useMemo(() =>
    transactions
      .filter(
        (t) =>
          t?.status ===
          "completed"
      )
      .reduce(
        (sum, t) =>
          sum +
          Math.max(
            0,
            Number(
              t?.amount ?? 0
            )
          ),
        0
      ),
  [transactions]
  );

  const totalUnits =
  useMemo(() =>
    properties.reduce(
      (sum, p) =>
        sum +
        Number(
          p?.units ?? 0
        ),
      0
    ),
  [properties]
  );

  const totalOccupied =
  useMemo(() =>
    properties.reduce(
      (sum, p) =>
        sum +
        Number(
          p?.occupied ?? 0
        ),
      0
    ),
  [properties]
  );

  const occupancy =
  useMemo(() =>
    totalUnits > 0
      ? (
          (totalOccupied /
            totalUnits) *
          100
        )
      : 0,
  [totalUnits, totalOccupied]
  );

  const pendingDues =
  useMemo(() =>
    transactions
      .filter(
        (t) =>
          t?.status ===
          "pending"
      )
      .reduce(
        (sum, t) =>
          sum +
          Math.max(
            0,
            Number(
              t?.amount ??
                0
            )
          ),
        0
      ),
  [transactions]
  );

const overdueDues =
  useMemo(() =>
    transactions
      .filter(
        (t) =>
          t?.status ===
          "overdue"
      )
      .reduce(
        (sum, t) =>
          sum +
          Math.max(
            0,
            Number(
              t?.amount ??
                0
            )
          ),
        0
      ),
  [transactions]
  );

  const trend =
    useMemo(() => {
      const now =
        new Date();

      const months: {
        key: string;
        label: string;
        total: number;
      }[] = [];

      for (
        let i = 5;
        i >= 0;
        i--
      ) {
        const d =
          new Date(
            now.getFullYear(),
            now.getMonth() -
              i,
            1
          );

        const key =
          monthKey(d);

        months.push({
          key,
          label:
            prettyMonth(
              key
            ),
          total: 0,
        });
      }

      for (const t of transactions) {
        if (
          t?.status !==
          "completed"
        ) {
          continue;
        }

        const k =
          monthKey(
            t?.date
          );

        const slot =
          months.find(
            (m) =>
              m.key ===
              k
          );

        if (slot) {
          slot.total +=
            Math.max(
              0,
              Number(
                t?.amount ??
                  0
              )
            );
        }
      }

      return months;
    }, [transactions]);

  const [rangeMonths, setRangeMonths] = useState(6);

  const tenantsById = useMemo(
    () => new Map((tenants as any[]).map((t: any) => [t.id, t])),
    [tenants]
  );

  const propertiesById = useMemo(
    () => new Map((properties as any[]).map((p: any) => [p.id, p])),
    [properties]
  );

  const filteredTrend = useMemo(() => {
    const now = new Date();
    const cutoff = new Date(now.getFullYear(), now.getMonth() - rangeMonths + 1, 1);
    return trend.filter((m) => {
      const [y, mo] = m.key.split("-").map(Number);
      const d = new Date(y, mo - 1, 1);
      return d >= cutoff;
    });
  }, [trend, rangeMonths]);

  const trendMax = useMemo(
  () => Math.max(1, ...filteredTrend.map((m) => Number(m?.total ?? 0))),
  [filteredTrend]
);

  const hasTrendData = useMemo(
  () => filteredTrend.some((m) => Number(m?.total ?? 0) > 0),
  [filteredTrend]
);

  const rangeOptions = [
    { value: 3, label: "3m" },
    { value: 6, label: "6m" },
    { value: 12, label: "12m" },
  ];

  if (error) return <ErrorState title="Failed to load overview" description={error} onRetry={refresh} />;
  if (loading) return <LoadingState title="Loading overview..." />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-display font-bold text-gradient">
          Welcome back, {displayName}
        </h1>

        <p className="text-muted-foreground font-alt tracking-wide">
          Here's what's happening across your portfolio.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 stagger-children">
        <KpiCard
          icon={Users}
          label="Active tenants"
          value={activeTenants.toLocaleString()}
          delta="Live"
        />

        <KpiCard
          icon={DollarSign}
          label="Collected revenue"
          value={fmtCompact(
            monthlyRevenue
          )}
          delta="Live"
        />

        <KpiCard
          icon={TrendingUp}
          label="Occupancy"
          value={`${occupancy.toFixed(
            1
          )}%`}
          delta="Live"
        />

        <KpiCard
          icon={AlertCircle}
          label="Pending dues"
          value={fmt(pendingDues)}
          delta="Fresh unpaid"
        />

        <KpiCard
          icon={AlertCircle}
          label="Overdue dues"
          value={fmt(overdueDues)}
          delta="Needs attention"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Revenue chart */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-gradient-card p-5 transition-smooth hover:-translate-y-1 hover:border-primary/30 hover:shadow-elegant">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div className="text-sm font-semibold text-gradient">
              Revenue
            </div>

            <div className="flex rounded-md border border-border overflow-hidden">
                {rangeOptions.map((o) => (
                  <button
                    key={o.value}
                    onClick={() => setRangeMonths(o.value)}
                    className={`px-2.5 py-1 text-xs font-medium transition-smooth ${
                      rangeMonths === o.value
                        ? "bg-primary text-primary-foreground"
                        : "bg-card text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

          {hasTrendData ? (
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={filteredTrend}>
                  <defs>
                    <linearGradient id="revenueBar" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(280 85% 55%)" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="hsl(280 85% 55%)" stopOpacity={0.3} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(270 20% 15%)" />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: "hsl(270 10% 60%)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "hsl(270 10% 60%)" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v: number) => fmtCompact(v)}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(270 35% 6%)",
                      border: "1px solid hsl(280 85% 55% / 0.3)",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    formatter={(value: number) => [fmt(value), "Revenue"]}
                  />
                  <Bar dataKey="total" fill="url(#revenueBar)" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="hsl(330 90% 60%)"
                    strokeWidth={2}
                    dot={{ fill: "hsl(330 90% 60%)", r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-52 grid place-items-center text-center">
              <div>
                <div className="font-display font-semibold">
                  No revenue data yet.
                </div>

                <div className="text-xs text-muted-foreground mt-1">
                  Once tenants start paying, your trend will appear here.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Recent transactions */}
        <div className="rounded-xl border border-border bg-gradient-card p-5 transition-smooth hover:-translate-y-1 hover:border-primary/30 hover:shadow-elegant">
          <div className="text-sm font-semibold mb-4 text-gradient">
            Recent transactions
          </div>

          {transactions.length ===
          0 ? (
            <div className="text-sm text-muted-foreground">
              No activity yet.
            </div>
          ) : (
            <div className="space-y-2">
              {transactions
                .slice(0, 5)
                .map((t) => {
                  const tenantName = t.tenantId ? (tenantsById.get(t.tenantId) as any)?.name : null;
                  const propertyName = t.propertyId ? (propertiesById.get(t.propertyId) as any)?.name : null;
                  return (
                    <div
                      key={t.id}
                      className="flex items-center justify-between gap-2 text-sm py-2 border-b border-border/40 last:border-0"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">
                          {tenantName || t?.tenant || t?.type || "—"}
                        </div>

                        <div className="text-[11px] text-muted-foreground truncate">
                          {propertyName || t?.property || "—"}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className={`font-semibold whitespace-nowrap ${
                          Number(t?.amount ?? 0) > 0
                            ? "text-primary"
                            : "text-destructive"
                        }`}>
                          {fmt(Number(t?.amount ?? 0))}
                        </div>

                        <div className="text-[11px] text-muted-foreground">
                          {t?.date
                            ? new Date(t.date).toLocaleDateString("en-IN", {
                                day: "numeric", month: "short",
                              })
                            : "—"}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>

      {/* Properties snapshot */}
      <div className="rounded-xl border border-border bg-gradient-card p-5 transition-smooth hover:-translate-y-1 hover:border-primary/30 hover:shadow-elegant">
        <div className="text-sm font-semibold mb-4 text-gradient">
          Properties snapshot
        </div>

        {properties.length ===
        0 ? (
          <div className="text-sm text-muted-foreground">
            Add your first property to get started.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {properties.map(
              (p) => (
                <div
                  key={p?.id}
                  className="rounded-lg border border-border p-4 transition-smooth hover:-translate-y-1 hover:border-primary/30 hover:shadow-elegant"
                >
                  <div className="font-display font-semibold truncate">
                    {p?.name ||
                      "Unnamed property"}
                  </div>

                  <div className="text-xs text-muted-foreground line-clamp-2">
                    {p?.address ||
                      "No address"}
                  </div>

                  <div className="mt-3 text-xs">
                    {Number(
                      p?.occupied ??
                        0
                    )}
                    /
                    {Number(
                      p?.units ??
                        0
                    )}{" "}
                    occupied
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
