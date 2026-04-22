import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function Dues() {
  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl md:text-3xl font-display font-bold">My dues</h1>
      <div className="rounded-xl border border-border bg-gradient-card p-6">
        <div className="text-sm text-muted-foreground">Total outstanding</div>
        <div className="text-4xl font-bold font-display mt-2">$1,200.00</div>
        <div className="text-sm text-muted-foreground mt-1">Rent · May 2026 · Due May 1</div>
        <Button variant="hero" className="mt-6 w-full sm:w-auto" onClick={() => toast.success("Payment initiated", { description: "Redirecting to checkout…" })}>
          Pay now
        </Button>
      </div>
    </div>
  );
}
