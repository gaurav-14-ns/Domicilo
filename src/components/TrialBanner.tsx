import { Link } from "react-router-dom";
import { useSubscriptionData } from "@/store/DataStore";
import { AlertTriangle, Crown } from "lucide-react";

export function TrialBanner() {
  const sub = useSubscriptionData();
  if (!sub) return null;
  if (sub.status === "active") return null;

  const trialEnd = sub.trialEnd ? new Date(sub.trialEnd).getTime() : 0;
  const trialDaysLeft = trialEnd ? Math.max(0, Math.ceil((trialEnd - Date.now()) / 86400_000)) : 0;
  const isTrial = sub.status === "trial" && trialDaysLeft > 0;
  const needsUpgrade = sub.status === "expired" || sub.status === "cancelled" || sub.status === "overdue";

  if (needsUpgrade) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 flex items-start sm:items-center gap-3 flex-col sm:flex-row">
        <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
        <div className="flex-1 text-sm font-alt">
          <span className="font-medium">Your plan is {sub.status}.</span>{" "}
          <span className="text-muted-foreground">Upgrade to keep premium features. Your data is safe.</span>
        </div>
        <Link to="/owner/settings" className="text-sm font-semibold text-destructive hover:underline">
          Upgrade now &rarr;
        </Link>
      </div>
    );
  }

  if (isTrial) {
    return (
      <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 flex items-start sm:items-center gap-3 flex-col sm:flex-row">
        <Crown className="h-5 w-5 text-primary shrink-0" />
        <div className="flex-1 text-sm font-alt">
          <span className="font-medium">Royal trial &middot; {trialDaysLeft} day{trialDaysLeft === 1 ? "" : "s"} left.</span>{" "}
          <span className="text-muted-foreground">Pick a plan to keep things running smoothly after your trial ends.</span>
        </div>
        <Link to="/owner/settings" className="text-sm font-semibold text-primary hover:underline">
          Choose a plan &rarr;
        </Link>
      </div>
    );
  }
  return null;
}
