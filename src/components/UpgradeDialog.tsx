import { ReactNode } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { usePlanLimits, PLAN_LABEL } from "@/hooks/usePlanLimits";

interface Props {
  open?: boolean;
  onOpenChange?: (v: boolean) => void;
  trigger?: ReactNode;
  reason?: string;
}

export function UpgradeDialog({ open, onOpenChange, trigger, reason }: Props) {
  const nav = useNavigate();
  const { plan, limits, activeTenants, propertyCount } = usePlanLimits();

  const goSettings = () => {
    onOpenChange?.(false);
    nav("/owner/settings");
  };

  const content = (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <div className="mx-auto h-12 w-12 rounded-full bg-gradient-primary grid place-items-center mb-2">
          <Sparkles className="h-6 w-6 text-primary-foreground" />
        </div>
        <DialogTitle className="text-center">Upgrade to keep going</DialogTitle>
        <DialogDescription className="text-center">
          {reason ?? `You've reached the ${PLAN_LABEL[plan]} plan limit.`}
        </DialogDescription>
      </DialogHeader>
      <div className="rounded-lg border border-border p-4 text-sm space-y-2 bg-muted/30">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Properties</span>
          <span className="font-medium">{propertyCount} / {limits.maxProperties === Infinity ? "∞" : limits.maxProperties}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Active tenants</span>
          <span className="font-medium">{activeTenants} / {limits.maxTenants === Infinity ? "∞" : limits.maxTenants}</span>
        </div>
      </div>
      <ul className="space-y-2 text-sm">
        <li className="flex gap-2"><Check className="h-4 w-4 text-primary mt-0.5" /> Up to 250 active tenants on Growth</li>
        <li className="flex gap-2"><Check className="h-4 w-4 text-primary mt-0.5" /> Unlimited properties</li>
        <li className="flex gap-2"><Check className="h-4 w-4 text-primary mt-0.5" /> Advanced reports & exports</li>
        <li className="flex gap-2"><Check className="h-4 w-4 text-primary mt-0.5" /> Your existing data stays safe</li>
      </ul>
      <DialogFooter className="sm:justify-center">
        <Button variant="hero" onClick={goSettings} className="w-full sm:w-auto">View plans</Button>
      </DialogFooter>
    </DialogContent>
  );

  if (trigger) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogTrigger asChild>{trigger}</DialogTrigger>
        {content}
      </Dialog>
    );
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {content}
    </Dialog>
  );
}
