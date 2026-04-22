import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useDataStore } from "@/store/DataStore";
import { useCurrentTenant, useTenantDues } from "@/hooks/useTenantData";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { formatINR } from "@/lib/format";
import { Loader2 } from "lucide-react";

export default function Dues() {
  const { user } = useAuth();
  const { data, updateTransaction } = useDataStore();
  const tenant = useCurrentTenant(data.tenants, user?.email);
  const outstanding = useTenantDues(data.transactions, tenant?.id);
  const pending = data.transactions.filter((t) => t.tenantId === tenant?.id && t.status === "pending");
  const [busy, setBusy] = useState(false);

  const payAll = async () => {
    if (!pending.length) {
      toast.info("Nothing to pay", { description: "You're all caught up." });
      return;
    }
    setBusy(true);
    await new Promise((r) => setTimeout(r, 600));
    pending.forEach((p) => updateTransaction(p.id, { status: "completed" }));
    setBusy(false);
    toast.success("Payment successful", { description: `${formatINR(outstanding)} cleared.` });
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl md:text-3xl font-display font-bold">My dues</h1>
      <div className="rounded-xl border border-border bg-gradient-card p-6">
        <div className="text-sm text-muted-foreground">Total outstanding</div>
        <div className="text-4xl font-bold font-display mt-2">{formatINR(outstanding)}</div>
        <div className="text-sm text-muted-foreground mt-1">
          {pending.length ? `${pending.length} pending charge${pending.length > 1 ? "s" : ""}` : "No pending charges"}
        </div>
        <Button variant="hero" className="mt-6 w-full sm:w-auto" disabled={busy || outstanding <= 0} onClick={payAll}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Pay now"}
        </Button>
      </div>
      {pending.length > 0 && (
        <div className="rounded-xl border border-border bg-gradient-card p-5">
          <div className="text-sm font-semibold mb-3">Breakdown</div>
          <div className="space-y-2 text-sm">
            {pending.map((p) => (
              <div key={p.id} className="flex justify-between border-t border-border pt-2">
                <span className="text-muted-foreground">{p.date} · {p.type}</span>
                <span className="font-medium">{formatINR(p.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
