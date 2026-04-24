import { useMemo, useState } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  RadioGroup, RadioGroupItem,
} from "@/components/ui/radio-group";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Transaction } from "@/store/types";

type Method = "upi" | "card" | "bank" | "cash";
const METHODS: { id: Method; label: string; hint: string }[] = [
  { id: "upi",  label: "UPI",            hint: "Google Pay, PhonePe, Paytm" },
  { id: "card", label: "Card",           hint: "Visa / Mastercard / Rupay" },
  { id: "bank", label: "Bank transfer",  hint: "NEFT / IMPS" },
  { id: "cash", label: "Cash",           hint: "Recorded in person" },
];

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  pending: Transaction[];
  tenantId: string | undefined;
  onPaid?: () => void;
}

export function PaymentDialog({ open, onOpenChange, pending, tenantId, onPaid }: Props) {
  const { fmt } = useCurrency();
  const [method, setMethod] = useState<Method>("upi");
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const total = useMemo(
    () => pending.reduce((s, t) => s + Math.max(0, t.amount), 0),
    [pending],
  );

  const reset = () => { setSuccess(null); setMethod("upi"); };

  const confirm = async () => {
    if (!tenantId || pending.length === 0) {
      toast.error("Nothing to pay");
      return;
    }
    if (total <= 0) {
      toast.error("Invalid amount", { description: "Total must be greater than zero." });
      return;
    }
    setBusy(true);
    try {
      const receipt = `RCPT-${Date.now().toString(36).toUpperCase()}`;
      const ids = pending.map((p) => p.id);
      // Atomic guard: only update rows still pending (prevents duplicate payment).
      const { data: updated, error } = await supabase
        .from("transactions")
        .update({ status: "completed", method, receipt_no: receipt })
        .in("id", ids)
        .eq("status", "pending")
        .select("id");
      if (error) throw error;
      if (!updated || updated.length === 0) {
        toast.warning("Already paid", { description: "These charges were settled in another session." });
        onOpenChange(false);
        return;
      }
      setSuccess(receipt);
      onPaid?.();
      toast.success("Payment successful", { description: `${fmt(total)} via ${method.toUpperCase()}` });
    } catch (err: any) {
      toast.error("Payment failed", { description: err.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}
    >
      <DialogContent className="max-w-md">
        {success ? (
          <div className="text-center py-6">
            <div className="mx-auto h-14 w-14 rounded-full bg-primary/15 grid place-items-center">
              <CheckCircle2 className="h-7 w-7 text-primary" />
            </div>
            <DialogTitle className="mt-4">Payment received</DialogTitle>
            <p className="text-sm text-muted-foreground mt-1">{fmt(total)} · {method.toUpperCase()}</p>
            <div className="mt-5 rounded-lg border border-border p-4 text-left text-sm bg-muted/30">
              <div className="flex justify-between"><span className="text-muted-foreground">Receipt</span><span className="font-mono">{success}</span></div>
              <div className="flex justify-between mt-1"><span className="text-muted-foreground">Date</span><span>{new Date().toLocaleString()}</span></div>
              <div className="flex justify-between mt-1"><span className="text-muted-foreground">Charges</span><span>{pending.length}</span></div>
            </div>
            <Button variant="hero" className="mt-5 w-full" onClick={() => onOpenChange(false)}>Done</Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Confirm payment</DialogTitle>
              <DialogDescription>Review your dues and choose a payment method.</DialogDescription>
            </DialogHeader>
            <div className="rounded-lg border border-border p-4 bg-muted/30">
              <div className="text-xs text-muted-foreground">Amount due</div>
              <div className="text-3xl font-bold font-display mt-1">{fmt(total)}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {pending.length} pending charge{pending.length === 1 ? "" : "s"}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Payment method</Label>
              <RadioGroup value={method} onValueChange={(v) => setMethod(v as Method)} className="grid grid-cols-2 gap-2">
                {METHODS.map((m) => (
                  <Label
                    key={m.id}
                    htmlFor={`pm-${m.id}`}
                    className={`cursor-pointer rounded-lg border px-3 py-2.5 text-sm transition-smooth ${
                      method === m.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                    }`}
                  >
                    <RadioGroupItem id={`pm-${m.id}`} value={m.id} className="sr-only" />
                    <div className="font-medium">{m.label}</div>
                    <div className="text-[11px] text-muted-foreground">{m.hint}</div>
                  </Label>
                ))}
              </RadioGroup>
              <p className="text-[11px] text-muted-foreground">
                Payment provider integration ready — currently records the payment instantly for demo.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>Cancel</Button>
              <Button variant="hero" onClick={confirm} disabled={busy}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : `Pay ${fmt(total)}`}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
