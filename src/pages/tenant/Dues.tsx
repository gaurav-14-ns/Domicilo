import {
  useMemo,
  useState,
} from "react";
import { useAuth } from "@/hooks/useAuth";
import { useDataStore } from "@/store/DataStore";
import {
  formatMoney,
} from "@/lib/currency";

import {
  prettyMonth,
  monthKey,
} from "@/lib/format";

import {
  useCurrentTenant,
  useTenantDues,
} from "@/hooks/useTenantData";

import { Button } from "@/components/ui/button";
import { Badge }
from "@/components/ui/badge";
import { LoadingState }
from "@/components/states/LoadingState";
import { ErrorState }
from "@/components/states/ErrorState";

import { TransactionRow }
from "@/components/finance/TransactionRow";
import { PaymentDialog } from "@/components/PaymentDialog";
import {
  CheckCircle2,
  AlertTriangle,
  Wallet,
  Receipt,
  ChevronDown,
  ChevronUp,
  Calendar,
} from "lucide-react";

export default function Dues() {

  const { user } =
    useAuth();

  const {
    data,
    loading,
    error,
    refresh,
  } = useDataStore();

  const tenant =
    useCurrentTenant(
      data?.tenants ?? [],
      user?.email
    );

  const outstanding =
    useTenantDues(
      data?.transactions ?? [],
      tenant?.id
    );

  const tenantTransactions =
  useMemo(() =>
    (data?.transactions ?? []).filter(
      (t) =>
        t.tenantId === tenant?.id
    ),
  [data?.transactions, tenant?.id]
  );

const pending =
  useMemo(() =>
    tenantTransactions.filter(
      (t) =>
        t.status === "pending" ||
        t.status === "overdue"
    ),
  [tenantTransactions]
  );

const overdue =
  useMemo(() =>
    tenantTransactions.filter(
      (t) =>
        t.status === "overdue"
    ),
  [tenantTransactions]
  );

const completed =
  useMemo(() =>
    tenantTransactions.filter(
      (t) =>
        t.status === "completed"
    ),
  [tenantTransactions]
  );

const now = new Date();
const currentMonth = monthKey(now);
const [viewMode, setViewMode] = useState<"monthly" | "yearly">("monthly");
const [selectedYear, setSelectedYear] = useState(now.getFullYear());
const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);

const periodFilter = useMemo(() => {
  if (viewMode === "monthly") {
    const m = String(selectedMonth).padStart(2, "0");
    return (tx: typeof tenantTransactions[0]) =>
      tx.date && tx.date.slice(0, 7) === `${selectedYear}-${m}`;
  } else {
    return (tx: typeof tenantTransactions[0]) =>
      tx.date && tx.date.slice(0, 4) === String(selectedYear);
  }
}, [viewMode, selectedYear, selectedMonth]);

const periodKey =
  useMemo(() =>
    viewMode === "monthly"
      ? `${selectedYear}-${String(selectedMonth).padStart(2, "0")}`
      : String(selectedYear),
  [viewMode, selectedYear, selectedMonth]
  );

const pendingInPeriod =
  useMemo(() =>
    pending.filter(periodFilter),
  [pending, periodFilter]
  );
const overdueInPeriod =
  useMemo(() =>
    overdue.filter(periodFilter),
  [overdue, periodFilter]
  );
const completedInPeriod =
  useMemo(() =>
    completed.filter(periodFilter),
  [completed, periodFilter]
  );
const paidInPeriodAmount =
  useMemo(() =>
    completedInPeriod.reduce((s, t) => s + Math.max(0, t.amount), 0),
  [completedInPeriod]
  );

const lastPayment =
  useMemo(() =>
    completed
      .slice()
      .sort(
        (a, b) => {
          const da = a.date ? new Date(a.date).getTime() : 0;
          const db = b.date ? new Date(b.date).getTime() : 0;
          return db - da;
        }
      )[0],
  [completed]
  );

const pendingByType = useMemo(() => {
  const groups: Record<string, typeof tenantTransactions> = {};
  for (const tx of pending) {
    if (!periodFilter(tx)) continue;
    const t = tx.type || "Other";
    if (!groups[t]) groups[t] = [];
    groups[t].push(tx);
  }
  return groups;
}, [pending, periodFilter]);

const typeTotal = (txs: typeof tenantTransactions) =>
  txs.reduce((s, t) => s + Math.max(0, t.amount), 0);

  const groupedTransactions =
  tenantTransactions.reduce(
    (
      acc,
      tx
    ) => {

      if (!tx.date) {
        return acc;
      }

      const mk =
        tx.date.slice(0, 7);

      if (!acc[mk]) {
        acc[mk] = [];
      }

      acc[mk].push(tx);

      return acc;

    },
    {} as Record<
      string,
      typeof tenantTransactions
    >
  );

  const years = useMemo(() => {
    const set = new Set<number>();
    set.add(new Date().getFullYear());
    for (const tx of tenantTransactions) {
      if (tx.date) {
        const y = new Date(tx.date).getFullYear();
        if (!isNaN(y)) set.add(y);
      }
    }
    return Array.from(set).sort();
  }, [tenantTransactions]);

  const [open, setOpen] =
    useState(false);

  const [payType, setPayType] = useState<string | null>(null);

  const [
  showCompleted,
  setShowCompleted,
] = useState(false);

  if (error) return <ErrorState title="Failed to load dues" description={error} onRetry={refresh} />;
  if (loading) return <LoadingState title="Loading dues..." />;

  return (
    <div className="space-y-6 w-full">

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h1 className="text-2xl md:text-3xl font-display font-bold text-gradient">
          My dues
        </h1>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex rounded-lg border border-border overflow-hidden text-sm">
            <button
              type="button"
              onClick={() => setViewMode("monthly")}
              className={`px-3 py-1.5 transition-colors ${viewMode === "monthly" ? "bg-primary text-primary-foreground" : "bg-transparent text-muted-foreground hover:text-foreground"}`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setViewMode("yearly")}
              className={`px-3 py-1.5 transition-colors ${viewMode === "yearly" ? "bg-primary text-primary-foreground" : "bg-transparent text-muted-foreground hover:text-foreground"}`}
            >
              Yearly
            </button>
          </div>

          {viewMode === "monthly" ? (
            <div className="flex items-center gap-1">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {new Date(2000, i, 1).toLocaleString("en-IN", { month: "short" })}
                  </option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
              >
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          ) : (
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
            >
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">

  <div className="rounded-xl border border-border bg-gradient-card p-4 transition-smooth hover:-translate-y-1 hover:border-primary/30 hover:shadow-elegant">
    <div className="flex items-center justify-between">
      <div className="text-sm text-muted-foreground">
        Outstanding
      </div>

      <Wallet className="h-4 w-4 text-muted-foreground" />
    </div>

    <div className="text-2xl font-bold font-display mt-3">
      {
        formatMoney(
          outstanding
        )
      }
    </div>

    <div className="text-xs text-muted-foreground mt-1">
      Total unpaid balance
    </div>
  </div>

  <div className="rounded-xl border border-border bg-gradient-card p-4 transition-smooth hover:-translate-y-1 hover:border-primary/30 hover:shadow-elegant">
    <div className="flex items-center justify-between">
      <div className="text-sm text-muted-foreground">
        Pending
      </div>

      <Receipt className="h-4 w-4 text-accent" />
    </div>

    <div className="text-2xl font-bold font-display mt-3">
      {pendingInPeriod.length}
    </div>

    <div className="text-xs text-muted-foreground mt-1">
      In {viewMode === "monthly" ? prettyMonth(periodKey) : periodKey}
    </div>
  </div>

  <div className="rounded-xl border border-border bg-gradient-card p-4 transition-smooth hover:-translate-y-1 hover:border-primary/30 hover:shadow-elegant">
    <div className="flex items-center justify-between">
      <div className="text-sm text-muted-foreground">
        Overdue
      </div>

      <AlertTriangle className="h-4 w-4 text-destructive" />
    </div>

    <div className="text-2xl font-bold font-display mt-3">
      {overdueInPeriod.length}
    </div>

    <div className="text-xs text-muted-foreground mt-1">
      In {viewMode === "monthly" ? prettyMonth(periodKey) : periodKey}
    </div>
  </div>

  <div className="rounded-xl border border-border bg-gradient-card p-4 transition-smooth hover:-translate-y-1 hover:border-primary/30 hover:shadow-elegant">
    <div className="flex items-center justify-between">
      <div className="text-sm text-muted-foreground">
        Paid
      </div>

      <CheckCircle2 className="h-4 w-4 text-primary" />
    </div>

    <div className="text-2xl font-bold font-display mt-3">
      {formatMoney(paidInPeriodAmount)}
    </div>

    <div className="text-xs text-muted-foreground mt-1">
      In {viewMode === "monthly" ? prettyMonth(periodKey) : periodKey}
    </div>
  </div>

</div>
      <div className="rounded-xl border border-border bg-gradient-card p-6 transition-smooth hover:-translate-y-1 hover:border-primary/30 hover:shadow-elegant">

        <div className="text-sm text-muted-foreground">
          Total outstanding
        </div>

        <div className="text-4xl font-bold font-display mt-2">
          {
            formatMoney(
              outstanding
            )
          }
        </div>

        <div className="text-sm text-muted-foreground mt-1">

  {
    pending.length
      ? `${pending.length} unpaid charge${pending.length > 1 ? "s" : ""}`
      : "You're all caught up"
  }

  {
    pending.some(
      (p) =>
        p.status === "overdue"
    ) && (
      <div className="mt-2 text-destructive font-medium">
        Some dues are overdue and require immediate attention.
      </div>
    )
  }

</div>

        {
          Object.keys(pendingByType).length > 0 ? (
            <div className="mt-6 space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Pay by type</div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(pendingByType).map(([type, txs]) => (
                  <Button
                    key={type}
                    variant="hero"
                    size="sm"
                    onClick={() => { setPayType(type); setOpen(true); }}
                  >
                    {type} · {formatMoney(typeTotal(txs))}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-6 inline-flex items-center gap-2 text-primary text-sm font-medium">
              <CheckCircle2 className="h-4 w-4" />
              No payment needed
            </div>
          )
        }

      </div>

      <div className="rounded-xl border border-border bg-gradient-card overflow-hidden">

  <div className="p-5 border-b border-border">

    <div className="flex items-center justify-between gap-3 flex-wrap">

      <div>
        <div className="text-sm font-semibold">
          Financial activity
        </div>

        <div className="text-xs text-muted-foreground mt-1">
          Charges, payments, refunds, and account activity.
        </div>
      </div>

      <Badge
        variant="outline"
        className="capitalize"
      >
        {tenantTransactions.length} total entries
      </Badge>

    </div>

  </div>

  {
    tenantTransactions.length === 0 ? (

      <div className="p-10 text-center">

        <div className="font-medium">
          No financial activity yet
        </div>

        <div className="text-sm text-muted-foreground mt-1">
          Charges and payments will appear here automatically.
        </div>

      </div>

    ) : (

      <div className="divide-y divide-border">

        {/* OVERDUE */}

{
  overdue.length > 0 && (

    <div>

      <div className="px-4 py-3 bg-red-500/5 border-b border-border">

        <div className="flex items-center gap-2">

          <AlertTriangle className="h-4 w-4 text-destructive" />

          <div className="font-medium text-destructive">
            Overdue
          </div>

        </div>

      </div>

      {
        overdue
          .slice()
          .sort(
            (a, b) => {
              const da = a.date ? new Date(a.date).getTime() : 0;
              const db = b.date ? new Date(b.date).getTime() : 0;
              return db - da;
            }
          )
          .map((t) => (

            <TransactionRow
              key={t.id}
              transaction={t}
            />

          ))
      }

    </div>

  )
}

{/* PENDING */}

{
  pending.filter(
    (t) =>
      t.status === "pending"
  ).length > 0 && (

    <div>

      <div className="px-4 py-3 bg-accent/5 border-y border-border">

        <div className="flex items-center gap-2">

          <Receipt className="h-4 w-4 text-accent" />

          <div className="font-medium text-accent">
            Pending
          </div>

        </div>

      </div>

      {
        pending
          .filter(
            (t) =>
              t.status === "pending"
          )
          .slice()
          .sort(
            (a, b) => {
              const da = a.date ? new Date(a.date).getTime() : 0;
              const db = b.date ? new Date(b.date).getTime() : 0;
              return db - da;
            }
          )
          .map((t) => (

            <TransactionRow
              key={t.id}
              transaction={t}
            />

          ))
      }

    </div>

  )
}

{/* COMPLETED */}

{
  completed.length > 0 && (

    <div>

      <div className="px-4 py-3 bg-primary/5 border-y border-border">

        <div className="flex items-center gap-2">

          <CheckCircle2 className="h-4 w-4 text-primary" />

            <div className="flex items-center justify-between w-full">

  <div className="font-medium text-primary">
    Completed
  </div>

  {
    completed.length > 5 && (

      <button
        type="button"
        onClick={() =>
          setShowCompleted(
            !showCompleted
          )
        }
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >

        {
          showCompleted ? (
            <>
              Show less
              <ChevronUp className="h-3 w-3" />
            </>
          ) : (
            <>
              Show all
              <ChevronDown className="h-3 w-3" />
            </>
          )
        }

      </button>

    )
  }

</div>

        </div>

      </div>

      {
        Object.entries(
  groupedTransactions
)
  .sort(
    ([a], [b]) =>
      b.localeCompare(a)
  )
  .map(
    ([
      month,
      txs,
    ]) => (

      <div key={month}>

        <div className="px-4 py-2 text-xs font-medium text-muted-foreground bg-muted/20 border-y border-border">
          {prettyMonth(month)}
        </div>

        {
          txs
            .filter(
              (t) =>
                t.status === "completed"
            )
            .slice(
              0,
              showCompleted
                ? undefined
                : 5
            )
            .sort(
              (a, b) => {
                const da = a.date ? new Date(a.date).getTime() : 0;
                const db = b.date ? new Date(b.date).getTime() : 0;
                return db - da;
              }
            )
            .map((t) => (

            <TransactionRow
              key={t.id}
              transaction={t}
            />

          ))

        }

      </div>

    ))
      }

    </div>

  )
}

      </div>

    )
  }

</div>

      <PaymentDialog
        open={open}
        onOpenChange={(v) => { setOpen(v); if (!v) setPayType(null); }}
        pending={payType ? (pendingByType[payType] ?? pending) : pending}
        tenantId={tenant?.id}
        onPaid={() => { setPayType(null); refresh(); }}
      />

    </div>
  );
}
