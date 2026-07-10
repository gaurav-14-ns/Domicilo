import { useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useDataStore } from "@/store/DataStore";
import { formatMoney } from "@/lib/currency";
import { prettyMonth, monthKey } from "@/lib/format";
import { useCurrentTenant, useTenantDues } from "@/hooks/useTenantData";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/states/LoadingState";
import { ErrorState } from "@/components/states/ErrorState";
import { TransactionRow } from "@/components/finance/TransactionRow";
import { PaymentDialog } from "@/components/PaymentDialog";
import { CheckCircle2, AlertTriangle, Wallet, Receipt } from "lucide-react";

export default function Dues() {
  const { user } = useAuth();
  const { data, loading, error, refresh } = useDataStore();
  const tenant = useCurrentTenant(data?.tenants ?? [], user?.email);
  const outstanding = useTenantDues(data?.transactions ?? [], tenant?.id);

  const tenantTransactions = useMemo(
    () => (data?.transactions ?? []).filter((t) => t.tenantId === tenant?.id),
    [data?.transactions, tenant?.id],
  );

  const pending = useMemo(
    () => tenantTransactions.filter((t) => t.status === "pending" || t.status === "overdue"),
    [tenantTransactions],
  );

  const completed = useMemo(
    () => tenantTransactions.filter((t) => t.status === "completed"),
    [tenantTransactions],
  );

  const now = new Date();
  const [viewMode, setViewMode] = useState<"monthly" | "yearly">("monthly");
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);

  const periodFilter = useMemo(() => {
    if (viewMode === "monthly") {
      const m = String(selectedMonth).padStart(2, "0");
      return (tx: typeof tenantTransactions[0]) =>
        tx.date && tx.date.slice(0, 7) === `${selectedYear}-${m}`;
    }
    return (tx: typeof tenantTransactions[0]) =>
      tx.date && tx.date.slice(0, 4) === String(selectedYear);
  }, [viewMode, selectedYear, selectedMonth]);

  const periodKey = viewMode === "monthly"
    ? `${selectedYear}-${String(selectedMonth).padStart(2, "0")}`
    : String(selectedYear);

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

  const hasOverdue = pending.some((p) => p.status === "overdue");

  const recentPayments = useMemo(
    () =>
      [...completed]
        .sort((a, b) => {
          const da = a.date ? new Date(a.date).getTime() : 0;
          const db = b.date ? new Date(b.date).getTime() : 0;
          return db - da;
        })
        .slice(0, 5),
    [completed],
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

  const [open, setOpen] = useState(false);
  const [payType, setPayType] = useState<string | null>(null);

  if (error) return <ErrorState title="Failed to load dues" description={error} onRetry={refresh} />;
  if (loading) return <LoadingState title="Loading dues..." />;

  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h1 className="text-2xl md:text-3xl font-display font-bold text-gradient">My dues</h1>
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

      <div className="rounded-xl border border-border bg-gradient-card p-6">
        <div className="flex items-center gap-3">
          <Wallet className="h-5 w-5 text-muted-foreground" />
          <div className="text-sm text-muted-foreground">
            Total outstanding {viewMode === "monthly" ? `for ${prettyMonth(periodKey)}` : `for ${periodKey}`}
          </div>
        </div>
        <div className="text-4xl font-bold font-display mt-2">{formatMoney(outstanding)}</div>
        <div className="text-sm text-muted-foreground mt-1">
          {pending.length ? `${pending.length} unpaid charge${pending.length > 1 ? "s" : ""}` : "You're all caught up"}
        </div>
        {hasOverdue && (
          <div className="mt-2 flex items-center gap-2 text-destructive font-medium text-sm">
            <AlertTriangle className="h-4 w-4" />
            Some dues are overdue.
          </div>
        )}
        {Object.keys(pendingByType).length > 0 ? (
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
              {Object.keys(pendingByType).length > 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setPayType(null); setOpen(true); }}
                >
                  <Receipt className="h-3.5 w-3.5 mr-1" />
                  Pay all
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="mt-6 inline-flex items-center gap-2 text-primary text-sm font-medium">
            <CheckCircle2 className="h-4 w-4" />
            No payment needed
          </div>
        )}
      </div>

      {recentPayments.length > 0 && (
        <div className="rounded-xl border border-border bg-gradient-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold">Recent payments</div>
                <div className="text-xs text-muted-foreground mt-0.5">Your last 5 completed transactions</div>
              </div>
            </div>
          </div>
          <div className="divide-y divide-border">
            {recentPayments.map((t) => (
              <TransactionRow key={t.id} transaction={t} compact />
            ))}
          </div>
        </div>
      )}

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
