import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TransactionStatusBadge } from "@/components/finance/TransactionStatusBadge";
import { formatMoney } from "@/lib/currency";
import { generateRentReceiptPDF } from "@/lib/rentReceipt";
import { useDataStore } from "@/store/DataStore";
import { useAuth } from "@/hooks/useAuth";
import { useCurrentTenant } from "@/hooks/useTenantData";
import { Download } from "lucide-react";
import type { Transaction } from "@/store/types";

interface Props {
  transaction: Transaction;
  compact?: boolean;
}

export function TransactionRow({ transaction: t, compact = false }: Props) {
  const { user } = useAuth();
  const { data } = useDataStore();
  const tenant = useCurrentTenant(data?.tenants ?? [], user?.email);

  const handleReceipt = () => {
    if (!tenant) return;
    generateRentReceiptPDF({
      transaction: t,
      tenant,
      settings: data?.settings,
    });
  };

  return (
    <div
      className={`
        ${compact ? "p-4" : "p-5"}
        hover:bg-muted/20
        transition-colors
      `}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="font-medium">
              {t.type}
            </div>
            <TransactionStatusBadge status={t.status} />
            {t.auto && (
              <Badge variant="outline" className="text-[10px]">auto</Badge>
            )}
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            {t.date}
          </div>
          {t.note && <div className="text-sm mt-2">{t.note}</div>}
          {t.receiptNo && (
            <div className="text-xs text-muted-foreground mt-2">
              Receipt: {t.receiptNo}
            </div>
          )}
        </div>
        <div className="text-right shrink-0">
          <div className={`text-base font-semibold ${t.amount < 0 ? "text-primary" : ""}`}>
            {formatMoney(t.amount)}
          </div>
          {t.method && <div className="text-xs text-muted-foreground mt-1 uppercase">{t.method}</div>}
          {t.status === "completed" && tenant && (
            <Button variant="ghost" size="sm" onClick={handleReceipt} className="mt-2 h-7 text-xs gap-1">
              <Download className="h-3 w-3" />
              Receipt
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
