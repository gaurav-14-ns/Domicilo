import { ArrowRight, Sparkles, ShieldCheck, IndianRupee } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export const Hero = () => {
  const nav = useNavigate();
  return (
    <section className="relative pt-32 pb-20 md:pt-44 md:pb-28 overflow-hidden bg-sunset bg-skyline">
      <div className="absolute inset-0 pattern-jaali opacity-40" aria-hidden />
      <div className="absolute top-1/4 left-1/3 h-96 w-96 bg-primary/20 blur-[150px] rounded-full animate-pulse-glow" aria-hidden />
      <div className="absolute bottom-0 right-1/4 h-64 w-64 bg-primary/10 blur-[100px] rounded-full" aria-hidden />
      <div className="container relative">
        <div className="mx-auto max-w-4xl text-center animate-fade-up">
          <div className="mb-8 flex items-center justify-center gap-3">
            <div className="relative">
              <div className="absolute -inset-4 rounded-full bg-primary/20 blur-2xl animate-pulse-glow" />
              <img
                src="/favicon.png"
                alt="Domicilo"
                className="relative h-28 w-28 md:h-36 md:w-36 rounded-3xl object-cover shadow-glow"
              />
            </div>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 backdrop-blur px-4 py-1.5 text-xs font-medium text-primary mb-6">
            <Sparkles className="h-3.5 w-3.5" />
            Premium property management, crafted for India
          </div>
          <h1 className="font-display text-4xl sm:text-5xl md:text-7xl font-bold leading-[1.08] tracking-tight">
            Manage every property with{" "}
            <span className="text-gold-shimmer">royal command.</span>
          </h1>
          <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed font-alt">
            Domicilo gives property owners, tenants, and managers a unified,
            elegant workspace — across every building, every room, every payment.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button variant="hero" size="xl" className="w-full sm:w-auto group shadow-glow text-base" onClick={() => nav("/auth")}>
              Start 14-day royal trial
              <ArrowRight className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button variant="outline" size="xl" className="w-full sm:w-auto text-base" onClick={() => nav("/#features")}>
              <IndianRupee className="h-4 w-4 mr-1" />
              See pricing
            </Button>
          </div>
          <div className="mt-8 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-primary" />
            No credit card required &middot; Cancel anytime &middot; Trusted by Indian property managers
          </div>
        </div>

        <div className="relative mt-20 mx-auto max-w-6xl animate-fade-up" style={{ animationDelay: "0.2s" }}>
          <div className="absolute -inset-4 bg-gradient-primary opacity-20 blur-3xl rounded-[2rem]" aria-hidden />
          <div className="relative rounded-2xl border border-border/60 bg-gradient-card shadow-elegant overflow-hidden glass-premium">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border/40 bg-muted/30">
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-destructive/60" />
                <div className="h-3 w-3 rounded-full bg-yellow-500/60" />
                <div className="h-3 w-3 rounded-full bg-green-500/60" />
              </div>
              <div className="ml-2 text-xs font-alt text-muted-foreground tracking-wide">domicilo.app / dashboard</div>
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
        <div key={i} className={`px-3 py-2 rounded-lg text-xs font-medium font-alt tracking-wide ${idx === 0 ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground transition-smooth"}`}>{i}</div>
      ))}
    </aside>
    <div className="col-span-12 md:col-span-10 space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { l: "Active tenants", v: "1,284", d: "+12.4%" },
          { l: "Monthly revenue", v: "₹18.4L", d: "+8.1%" },
          { l: "Occupancy", v: "94.2%", d: "+2.3%" },
          { l: "Pending dues", v: "₹3.2L", d: "−18%" },
        ].map((k) => (
          <div key={k.l} className="stat-card">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">{k.l}</div>
            <div className="mt-1 text-xl md:text-2xl font-bold font-display">{k.v}</div>
            <div className={`text-[10px] font-medium mt-1 ${k.d.startsWith("+") ? "text-primary" : "text-destructive"}`}>{k.d}</div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="md:col-span-2 rounded-xl border border-border/40 bg-background/40 p-4 h-48">
          <div className="text-xs font-medium font-display mb-3 tracking-wide">Revenue · last 6 months</div>
          <div className="flex items-end gap-2 h-32">
            {[40, 65, 50, 78, 72, 92].map((h, i) => (
              <div key={i} className="flex-1 rounded-t-md bg-gradient-primary opacity-70 hover:opacity-100 transition-smooth cursor-pointer" style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-border/40 bg-background/40 p-4 h-48">
          <div className="text-xs font-medium font-display mb-3 tracking-wide">Recent transactions</div>
          <div className="space-y-2">
            {[["Sara M.", "+₹1,200"], ["Apt 4B", "+₹950"], ["John D.", "−₹50"], ["Tower A", "+₹2,100"]].map(([n, a]) => (
              <div key={n} className="flex items-center justify-between text-xs py-0.5">
                <span className="text-muted-foreground font-alt">{n}</span>
                <span className={`font-medium ${a.startsWith("+") ? "text-green-600 dark:text-green-400" : "text-destructive"}`}>{a}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);
