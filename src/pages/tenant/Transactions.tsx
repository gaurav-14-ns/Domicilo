import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useAuth } from "@/hooks/useAuth";
import { useDataStore } from "@/store/DataStore";
import { useCurrency } from "@/hooks/useCurrency";

import {
  useCurrentTenant,
  useTenantTransactions,
} from "@/hooks/useTenantData";

import { TransactionRow }
from "@/components/finance/TransactionRow";

import { Button }
from "@/components/ui/button";

import { Input }
from "@/components/ui/input";

import {
  Download,
  Search,
} from "lucide-react";

import {
  downloadCSV,
} from "@/lib/format";

export default function TenantTransactions() {

  const { user } =
    useAuth();

  const { data } =
    useDataStore();

  const {
    code,
    locale,
  } = useCurrency();

  const tenant =
    useCurrentTenant(
      data.tenants,
      user?.email
    );

  const txs =
    useTenantTransactions(
      data.transactions,
      tenant?.id
    );

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    fromDate,
    setFromDate,
  ] = useState("");

  const [
    toDate,
    setToDate,
  ] = useState("");

  const [
    currentPage,
    setCurrentPage,
  ] = useState(1);

  const pageSize = 10;

  const filteredTransactions =
    useMemo(() => {

      return txs.filter((t) => {

        const matchesSearch =
          !search ||
          t.type
            .toLowerCase()
            .includes(
              search.toLowerCase()
            );

        const matchesFrom =
          !fromDate ||
          t.date >= fromDate;

        const matchesTo =
          !toDate ||
          t.date <= toDate;

        return (
          matchesSearch &&
          matchesFrom &&
          matchesTo
        );

      });

    }, [
      txs,
      search,
      fromDate,
      toDate,
    ]);

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filteredTransactions.length /
        pageSize
      )
    );

  const safeCurrentPage =
  Math.min(
    currentPage,
    totalPages
  );

  const paginatedTransactions =
    filteredTransactions
      .slice()
      .sort(
        (a, b) =>
          new Date(b.date).getTime() -
          new Date(a.date).getTime()
      )
      .slice(
        (safeCurrentPage - 1) * pageSize,
        safeCurrentPage * pageSize
      );

  useEffect(() => {

  setCurrentPage(1);

}, [
  search,
  fromDate,
  toDate,
]);

  const exportRows =
    filteredTransactions.map(
      (t) => ({
        Date: t.date,
        Type: t.type,
        Amount: t.amount,
        Status: t.status,
        Method:
          t.method ?? "",
        Receipt:
          t.receiptNo ?? "",
        Note:
          t.note ?? "",
      })
    );

  return (

    <div className="space-y-6">

      <div>

        <h1 className="text-2xl md:text-3xl font-display font-bold text-gradient">
          Transaction history
        </h1>

        <p className="text-muted-foreground mt-1 font-alt tracking-wide">
          Complete history of charges, payments, refunds, and account activity.
        </p>

      </div>

      <div
        className="
          flex
          flex-col
          xl:flex-row
          gap-3
          xl:items-center
          xl:justify-between
        "
      >

        <div
  className="
    grid
    grid-cols-1
    md:grid-cols-2
    xl:grid-cols-4
    gap-3
    flex-1
  "
>

  <div className="space-y-2">

    <div className="text-sm font-medium">
      Search
    </div>

    <div className="relative">

      <Search
        className="
          h-4
          w-4
          absolute
          left-3
          top-1/2
          -translate-y-1/2
          text-muted-foreground
        "
      />

      <Input
        placeholder="Search transaction type..."
        value={search}
        onChange={(e) =>
          setSearch(
            e.target.value
          )
        }
        className="pl-9"
      />

    </div>

  </div>

  <div className="space-y-2">

    <div className="text-sm font-medium">
      From Date
    </div>

    <Input
      type="date"
      value={fromDate}
      onChange={(e) =>
        setFromDate(
          e.target.value
        )
      }
    />

  </div>

  <div className="space-y-2">

    <div className="text-sm font-medium">
      To Date
    </div>

    <Input
      type="date"
      value={toDate}
      onChange={(e) =>
        setToDate(
          e.target.value
        )
      }
    />

  </div>

  <div className="space-y-2">

    <div className="text-sm font-medium opacity-0">
      Actions
    </div>

    <div className="flex gap-2">

      <Button
        variant="outline"
        className="flex-1"
        onClick={() => {

          setSearch("");
          setFromDate("");
          setToDate("");
          setCurrentPage(1);

        }}
      >
        Reset Filters
      </Button>

      <Button
        variant="outline"
        className="shrink-0"
        onClick={() =>
          downloadCSV(
            exportRows,
            "tenant-transactions"
          )
        }
        disabled={
          exportRows.length === 0
        }
      >

        <Download className="h-4 w-4 mr-2" />

        Export

      </Button>

    </div>

  </div>

</div>

      </div>

      {filteredTransactions.length === 0 ? (

        <div className="rounded-xl border border-dashed border-border p-12 text-center">

          <div className="font-display font-semibold">
            No transactions found
          </div>

          <div className="text-sm text-muted-foreground">
            Try adjusting your filters or search query.
          </div>

        </div>

      ) : (

        <div className="space-y-4">

          <div className="rounded-xl border border-border bg-gradient-card overflow-hidden">

            <div className="divide-y divide-border">

              {
                paginatedTransactions.map((t) => (

                  <TransactionRow
                    key={t.id}
                    transaction={t}
                    currency={
                      tenant?.currencyCode ??
                      code
                    }
                    locale={
                      tenant?.locale ??
                      locale
                    }
                  />

                ))
              }

            </div>

          </div>

          <div
            className="
              flex
              flex-col
              sm:flex-row
              items-start
              sm:items-center
              justify-between
              gap-3
            "
          >

            <div className="text-sm text-muted-foreground">

              Showing{" "}
              {paginatedTransactions.length}{" "}
              of{" "}
              {filteredTransactions.length}{" "}
              transactions

            </div>

            <div className="flex items-center gap-2">

              <Button
                variant="outline"
                size="sm"
                disabled={safeCurrentPage === 1}
                onClick={() =>
                  setCurrentPage(
  safeCurrentPage - 1
)
                }
              >
                Previous
              </Button>

              <div className="text-sm font-medium px-2">

                Page {safeCurrentPage} of {totalPages}

              </div>

              <Button
                variant="outline"
                size="sm"
                disabled={
  safeCurrentPage === totalPages
}
                onClick={() =>
                  setCurrentPage(
  safeCurrentPage + 1
)
                }
              >
                Next
              </Button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}
