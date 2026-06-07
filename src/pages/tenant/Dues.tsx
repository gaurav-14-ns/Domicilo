import {
  useState,
} from "react";
import { useAuth } from "@/hooks/useAuth";
import { useDataStore } from "@/store/DataStore";
import { useCurrency } from "@/hooks/useCurrency";

import {
  formatMoney,
} from "@/lib/currency";

import {
  prettyMonth,
} from "@/lib/format";

import {
  useCurrentTenant,
  useTenantDues,
} from "@/hooks/useTenantData";

import { Button } from "@/components/ui/button";
import { Badge }
from "@/components/ui/badge";

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
} from "lucide-react";

export default function Dues() {

  const { user } =
    useAuth();

  const {
    data,
    refresh,
  } = useDataStore();

  const {
    code,
    locale,
  } = useCurrency();

  const tenant =
    useCurrentTenant(
      data.tenants,
      user?.email
    );

  const outstanding =
    useTenantDues(
      data?.transactions ?? [],
      tenant?.id
    );

  const tenantTransactions =
  (data?.transactions ?? []).filter(
    (t) =>
      t.tenantId === tenant?.id
  );

const pending =
  tenantTransactions.filter(
    (t) =>
      t.status === "pending" ||
      t.status === "overdue"
  );

const overdue =
  tenantTransactions.filter(
    (t) =>
      t.status === "overdue"
  );

const completed =
  tenantTransactions.filter(
    (t) =>
      t.status === "completed"
  );

const completedThisMonth =
  completed.filter((t) => {

    const now = new Date();

    const txDate =
      new Date(t.date);

    return (
      txDate.getMonth() ===
        now.getMonth() &&
      txDate.getFullYear() ===
        now.getFullYear()
    );
  });

const lastPayment =
  completed
    .slice()
    .sort(
      (a, b) =>
        new Date(b.date).getTime() -
        new Date(a.date).getTime()
    )[0];

  const groupedTransactions =
  tenantTransactions.reduce(
    (
      acc,
      tx
    ) => {

      if (!tx.date) {
        return acc;
      }

      const monthKey =
        tx.date.slice(0, 7);

      if (!acc[monthKey]) {
        acc[monthKey] = [];
      }

      acc[monthKey].push(tx);

      return acc;

    },
    {} as Record<
      string,
      typeof tenantTransactions
    >
  );

  const primaryCurrency =
    pending[0]?.currencyCode ??
    tenant?.currencyCode ??
    code;

  const primaryLocale =
    pending[0]?.locale ??
    tenant?.locale ??
    locale;

  const [open, setOpen] =
    useState(false);

  const [
  showCompleted,
  setShowCompleted,
] = useState(false);

  return (
    <div className="space-y-6 w-full">

      <h1 className="text-2xl md:text-3xl font-display font-bold text-gradient">
        My dues
      </h1>
      <div className="grid gap-4 md:grid-cols-4">

  <div className="rounded-xl border border-border bg-gradient-card p-4">
    <div className="flex items-center justify-between">
      <div className="text-sm text-muted-foreground">
        Outstanding
      </div>

      <Wallet className="h-4 w-4 text-muted-foreground" />
    </div>

    <div className="text-2xl font-bold font-display mt-3">
      {
        formatMoney(
          outstanding,
          primaryCurrency,
          primaryLocale
        )
      }
    </div>

    <div className="text-xs text-muted-foreground mt-1">
      Current unpaid balance
    </div>
  </div>

  <div className="rounded-xl border border-border bg-gradient-card p-4">
    <div className="flex items-center justify-between">
      <div className="text-sm text-muted-foreground">
        Pending
      </div>

      <Receipt className="h-4 w-4 text-yellow-600" />
    </div>

    <div className="text-2xl font-bold font-display mt-3">
      {pending.length}
    </div>

    <div className="text-xs text-muted-foreground mt-1">
      Awaiting payment
    </div>
  </div>

  <div className="rounded-xl border border-border bg-gradient-card p-4">
    <div className="flex items-center justify-between">
      <div className="text-sm text-muted-foreground">
        Overdue
      </div>

      <AlertTriangle className="h-4 w-4 text-red-600" />
    </div>

    <div className="text-2xl font-bold font-display mt-3">
      {overdue.length}
    </div>

    <div className="text-xs text-muted-foreground mt-1">
      Requires attention
    </div>
  </div>

  <div className="rounded-xl border border-border bg-gradient-card p-4">
    <div className="flex items-center justify-between">
      <div className="text-sm text-muted-foreground">
        Paid This Month
      </div>

      <CheckCircle2 className="h-4 w-4 text-green-600" />
    </div>

    <div className="text-2xl font-bold font-display mt-3">
      {completedThisMonth.length}
    </div>

    <div className="text-xs text-muted-foreground mt-1">

      {
        lastPayment
          ? `Last paid on ${lastPayment.date}`
          : "No payments yet"
      }

    </div>
  </div>

</div>
      <div className="rounded-xl border border-border bg-gradient-card p-6">

        <div className="text-sm text-muted-foreground">
          Total outstanding
        </div>

        <div className="text-4xl font-bold font-display mt-2">
          {
            formatMoney(
              outstanding,
              primaryCurrency,
              primaryLocale
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
      <div className="mt-2 text-red-600 font-medium">
        Some dues are overdue and require immediate attention.
      </div>
    )
  }

</div>

        {
          pending.length === 0 ? (

            <div className="mt-6 inline-flex items-center gap-2 text-primary text-sm font-medium">
              <CheckCircle2 className="h-4 w-4" />
              No payment needed
            </div>

          ) : (

            <Button
              variant="hero"
              className="mt-6 w-full sm:w-auto"
              disabled={outstanding <= 0}
              onClick={() => setOpen(true)}
            >
              Pay now · {
                formatMoney(
                  outstanding,
                  primaryCurrency,
                  primaryLocale
                )
              }
            </Button>

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

          <AlertTriangle className="h-4 w-4 text-red-600" />

          <div className="font-medium text-red-600">
            Overdue
          </div>

        </div>

      </div>

      {
        overdue
          .slice()
          .sort(
            (a, b) =>
              new Date(b.date).getTime() -
              new Date(a.date).getTime()
          )
          .map((t) => (

            <TransactionRow
              key={t.id}
              transaction={t}
              currency={primaryCurrency}
              locale={primaryLocale}
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

      <div className="px-4 py-3 bg-yellow-500/5 border-y border-border">

        <div className="flex items-center gap-2">

          <Receipt className="h-4 w-4 text-yellow-600" />

          <div className="font-medium text-yellow-600">
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
            (a, b) =>
              new Date(b.date).getTime() -
              new Date(a.date).getTime()
          )
          .map((t) => (

            <TransactionRow
              key={t.id}
              transaction={t}
              currency={primaryCurrency}
              locale={primaryLocale}
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

      <div className="px-4 py-3 bg-green-500/5 border-y border-border">

        <div className="flex items-center gap-2">

          <CheckCircle2 className="h-4 w-4 text-green-600" />

            <div className="flex items-center justify-between w-full">

  <div className="font-medium text-green-600">
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
              (a, b) =>
                new Date(b.date).getTime() -
                new Date(a.date).getTime()
            )
            .map((t) => (

            <TransactionRow
              key={t.id}
              transaction={t}
              currency={primaryCurrency}
              locale={primaryLocale}
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
        onOpenChange={setOpen}
        pending={pending}
        tenantId={tenant?.id}
        onPaid={refresh}
      />

    </div>
  );
}
