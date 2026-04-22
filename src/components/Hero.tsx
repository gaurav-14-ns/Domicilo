import { ArrowRight, Sparkles, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export const Hero = () => {
  const nav = useNavigate();
  return (
    <section className="relative pt-32 pb-20 md:pt-44 md:pb-28 overflow-hidden bg-hero">
      <div className="absolute inset-0 grid-pattern opacity-60" aria-hidden />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 h-72 w-[36rem] bg-primary/30 blur-[120px] rounded-full animate-pulse-glow" aria-hidden />
      <div className="container relative">
        <div className="mx-auto max-w-3xl text-center animate-fade-up">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background/80 backdrop-blur px-4 py-1.5 text-xs font-medium text-muted-foreground mb-6">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Property management, reimagined for 2026
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold leading-[1.05] tracking-tight">
            Run every property like <span className="text-gradient">a single command center.</span>
          </h1>
          <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Domicilo gives owners and operators a unified workspace for tenants, rooms, billing pauses, and rent collection — across every building.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button variant="hero" size="xl" className="w-full sm:w-auto group" onClick={() => nav("/auth")}>
              Start 14-day trial
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button variant="glass" size="xl" className="w-full sm:w-auto" onClick={() => toast.info("Demo video coming soon", { description: "We'll email you the link." })}>
              Watch 2-min demo
            </Button>
          </div>
          <div className="mt-8 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-primary" />
            No credit card · Cancel anytime · SOC 2 ready
          </div>
        </div>

        <div className="relative mt-20 mx-auto max-w-6xl animate-fade-up" style={{ animationDelay: "0.2s" }}>
          <div className="absolute -inset-4 bg-gradient-primary opacity-30 blur-3xl rounded-[2rem]" aria-hidden />
          <div className="relative rounded-2xl border border-border bg-gradient-card shadow-elegant overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/40">
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-destructive/60" />
                <div className="h-3 w-3 rounded-full bg-yellow-500/60" />
                <div className="h-3 w-3 rounded-full bg-green-500/60" />
              </div>
              <div className="ml-2 text-xs text-muted-foreground">app.domicilo.com / dashboard</div>
            </div>
            <DashboardMock />
          </div>
        </div>
      </div>
    </section>
  );
};

const DashboardMock = () => (
  <div className="grid grid-cols-12 gap-4 p-4 md:p-6">
    <aside className="hidden md:flex col-span-2 flex-col gap-1.5">
      {["Overview", "Properties", "Tenants", "Rooms", "Billing", "Reports", "Settings"].map((i, idx) => (
        <div key={i} className={`px-3 py-2 rounded-lg text-xs font-medium ${idx === 0 ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}>{i}</div>
      ))}
    </aside>
    <div className="col-span-12 md:col-span-10 space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { l: "Active tenants", v: "1,284", d: "+12.4%" },
          { l: "Monthly revenue", v: "$184K", d: "+8.1%" },
          { l: "Occupancy", v: "94.2%", d: "+2.3%" },
          { l: "Pending dues", v: "$3.2K", d: "-18%" },
        ].map((k) => (
          <div key={k.l} className="rounded-xl border border-border bg-background/60 p-4">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{k.l}</div>
            <div className="mt-1 text-xl md:text-2xl font-bold font-display">{k.v}</div>
            <div className="text-[10px] text-primary font-medium mt-1">{k.d}</div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="md:col-span-2 rounded-xl border border-border bg-background/60 p-4 h-48">
          <div className="text-xs font-medium mb-3">Revenue · last 6 months</div>
          <div className="flex items-end gap-2 h-32">
            {[40, 65, 50, 78, 72, 92].map((h, i) => (
              <div key={i} className="flex-1 rounded-t-md bg-gradient-primary opacity-80" style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-background/60 p-4 h-48">
          <div className="text-xs font-medium mb-3">Recent transactions</div>
          <div className="space-y-2">
            {[["Sara M.", "+$1,200"], ["Apt 4B", "+$950"], ["John D.", "-$50"], ["Tower A", "+$2,100"]].map(([n, a]) => (
              <div key={n} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{n}</span>
                <span className={`font-medium ${a.startsWith("+") ? "text-primary" : "text-destructive"}`}>{a}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);
