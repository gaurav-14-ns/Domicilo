import { Link } from "react-router-dom";
import { useSubscription } from "@/hooks/useSubscription";
import { Sparkles, AlertTriangle } from "lucide-react";

export function TrialBanner() {
  const { subscription, isTrial, trialDaysLeft, needsPaidUpgrade } = useSubscription();
  if (!subscription) return null;
  if (subscription.status === "active") return null;

  if (needsPaidUpgrade) {
    return (
      <div className="rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-3 flex items-start sm:items-center gap-3 flex-col sm:flex-row">
        <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
        <div className="flex-1 text-sm">
          <span className="font-medium">Your plan is {subscription.status}.</span>{" "}
          <span className="text-muted-foreground">Upgrade to keep premium features. Your data is safe.</span>
        </div>
        <Link to="/owner/settings" className="text-sm font-semibold text-destructive hover:underline">
          Upgrade now →
        </Link>
      </div>
    );
  }

  if (isTrial) {
    return (
      <div className="rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 flex items-start sm:items-center gap-3 flex-col sm:flex-row">
        <Sparkles className="h-5 w-5 text-primary shrink-0" />
        <div className="flex-1 text-sm">
          <span className="font-medium">Free trial · {trialDaysLeft} day{trialDaysLeft === 1 ? "" : "s"} left.</span>{" "}
          <span className="text-muted-foreground">Pick a plan to keep things running smoothly after your trial ends.</span>
        </div>
        <Link to="/owner/settings" className="text-sm font-semibold text-primary hover:underline">
          Choose a plan →
        </Link>
      </div>
    );
  }
  return null;
}
