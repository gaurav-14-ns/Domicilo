import { ReactNode, useState } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldCheck, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { useSubscription } from "@/hooks/useSubscription";
import { useCurrency } from "@/hooks/useCurrency";
import { planPriceIn, type PlanId } from "@/lib/currency";

interface Props {
  plan: PlanId;
  planLabel: string;
  trigger: ReactNode;
  onActivated?: () => void;
}

export function UpgradePlaceholderDialog({ plan, planLabel, trigger, onActivated }: Props) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const { changePlan } = useSubscription();
  const { code, locale } = useCurrency();

  const activate = async () => {
    setBusy(true);
    try {
      await changePlan(plan);
      toast.success(`${planLabel} activated`, { description: "No payment required during preview." });
      setOpen(false);
      onActivated?.();
    } catch (err: any) {
      toast.error("Couldn't activate plan", { description: err.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Upgrade to {planLabel}
          </DialogTitle>
          <DialogDescription>
            {planPriceIn(plan, code, locale)} / month. Payment processing is rolling out soon — meanwhile
            you can activate the plan for testing and exploring premium features.
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground flex items-start gap-2">
          <ShieldCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          You will be billed only after the live payment provider is enabled. Cancel anytime from Settings.
        </div>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={busy}>
            Maybe later
          </Button>
          <Button variant="hero" onClick={activate} disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : `Activate ${planLabel}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
