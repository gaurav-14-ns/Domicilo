import { ReactNode, useEffect, useState } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Pause, Play, Building2, Users, Wallet, BarChart3, ShieldCheck } from "lucide-react";

interface Props { trigger: ReactNode }

const slides = [
  {
    icon: Building2,
    title: "One workspace, every building",
    body: "See every property, room and unit in a single command center. Add a building in seconds.",
    accent: "from-primary/30 to-primary/5",
  },
  {
    icon: Users,
    title: "Tenants & lifecycle",
    body: "Add tenants, assign rooms, pause billing on holiday, and handle move-outs gracefully.",
    accent: "from-blue-500/30 to-blue-500/5",
  },
  {
    icon: Wallet,
    title: "Rent collection on autopilot",
    body: "Auto-generated rent rows, one-tap Pay Now for tenants, instant receipts in any currency.",
    accent: "from-emerald-500/30 to-emerald-500/5",
  },
  {
    icon: BarChart3,
    title: "Reports that mean something",
    body: "Live revenue trends, occupancy by property, pending dues — straight from your data.",
    accent: "from-purple-500/30 to-purple-500/5",
  },
  {
    icon: ShieldCheck,
    title: "Owner · Tenant · Admin",
    body: "Strict role-based access, audit logs, secure auth. Built like the SaaS you want to run.",
    accent: "from-amber-500/30 to-amber-500/5",
  },
];

export function DemoVideoDialog({ trigger }: Props) {
  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    if (!open) { setIdx(0); setPlaying(true); }
  }, [open]);

  useEffect(() => {
    if (!open || !playing) return;
    const t = setTimeout(() => setIdx((i) => (i + 1) % slides.length), 3500);
    return () => clearTimeout(t);
  }, [open, playing, idx]);

  const Icon = slides[idx].icon;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-3xl p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>Domicilo · 2-min walkthrough</DialogTitle>
          <DialogDescription>Owner · Tenant · Admin — see what shipping a real property OS feels like.</DialogDescription>
        </DialogHeader>

        <div className="relative aspect-video mx-6 rounded-xl overflow-hidden border border-border bg-gradient-card">
          <div className={`absolute inset-0 bg-gradient-to-br ${slides[idx].accent} transition-all duration-500`} aria-hidden />
          <div className="absolute inset-0 grid-pattern opacity-30" aria-hidden />
          <div className="absolute inset-0 grid place-items-center px-6">
            <div className="text-center max-w-md animate-fade-up" key={idx}>
              <div className="mx-auto h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-background/80 backdrop-blur grid place-items-center shadow-elegant">
                <Icon className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
              </div>
              <div className="mt-5 font-display font-semibold text-xl sm:text-2xl">{slides[idx].title}</div>
              <div className="mt-2 text-sm text-muted-foreground">{slides[idx].body}</div>
            </div>
          </div>

          {/* prev/next */}
          <button
            onClick={() => { setPlaying(false); setIdx((i) => (i - 1 + slides.length) % slides.length); }}
            className="absolute left-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-background/70 backdrop-blur grid place-items-center hover:bg-background transition"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => { setPlaying(false); setIdx((i) => (i + 1) % slides.length); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-background/70 backdrop-blur grid place-items-center hover:bg-background transition"
            aria-label="Next slide"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <div className="flex items-center justify-between gap-3 px-6 pb-6 pt-4">
          <div className="flex gap-1.5">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => { setPlaying(false); setIdx(i); }}
                className={`h-1.5 rounded-full transition-all ${i === idx ? "w-8 bg-primary" : "w-3 bg-muted-foreground/30 hover:bg-muted-foreground/60"}`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={() => setPlaying((p) => !p)}>
              {playing ? <><Pause className="h-3.5 w-3.5" /> Pause</> : <><Play className="h-3.5 w-3.5" /> Play</>}
            </Button>
            <span className="text-[11px] text-muted-foreground tabular-nums">{idx + 1} / {slides.length}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
