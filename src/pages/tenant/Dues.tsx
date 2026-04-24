import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useDataStore } from "@/store/DataStore";
import { useCurrency } from "@/hooks/useCurrency";
import { useCurrentTenant, useTenantDues } from "@/hooks/useTenantData";
import { Button } from "@/components/ui/button";
import { PaymentDialog } from "@/components/PaymentDialog";
import { CheckCircle2 } from "lucide-react";

export default function Dues() {
  const { user } = useAuth();
  const { data, refresh } = useDataStore();
  const { fmt } = useCurrency();
  const tenant = useCurrentTenant(data.tenants, user?.email);
  const outstanding = useTenantDues(data.transactions, tenant?.id);
  const pending = data.transactions.filter((t) => t.tenantId === tenant?.id && t.status === "pending");
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl md:text-3xl font-display font-bold">My dues</h1>
      <div className="rounded-xl border border-border bg-gradient-card p-6">
        <div className="text-sm text-muted-foreground">Total outstanding</div>
        <div className="text-4xl font-bold font-display mt-2">{fmt(outstanding)}</div>
        <div className="text-sm text-muted-foreground mt-1">
          {pending.length ? `${pending.length} pending charge${pending.length > 1 ? "s" : ""}` : "You're all caught up"}
        </div>
        {pending.length === 0 ? (
          <div className="mt-6 inline-flex items-center gap-2 text-primary text-sm font-medium">
            <CheckCircle2 className="h-4 w-4" /> No payment needed
          </div>
        ) : (
          <Button
            variant="hero"
            className="mt-6 w-full sm:w-auto"
            disabled={outstanding <= 0}
            onClick={() => setOpen(true)}
          >
            Pay now · {fmt(outstanding)}
          </Button>
        )}
      </div>
      {pending.length > 0 && (
        <div className="rounded-xl border border-border bg-gradient-card p-5">
          <div className="text-sm font-semibold mb-3">Breakdown</div>
          <div className="space-y-2 text-sm">
            {pending.map((p) => (
              <div key={p.id} className="flex justify-between border-t border-border pt-2">
                <span className="text-muted-foreground">{p.date} · {p.type}</span>
                <span className="font-medium">{fmt(p.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

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
