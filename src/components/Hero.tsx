import { ArrowRight, Sparkles, ShieldCheck, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useEffect, useRef } from "react";

const statCards = [
  { l: "Active tenants", v: "1,284", d: "+12.4%" },
  { l: "Monthly revenue", v: "₹18.4L", d: "+8.1%" },
  { l: "Occupancy", v: "94.2%", d: "+2.3%" },
  { l: "Pending dues", v: "₹3.2L", d: "−18%" },
];

const DashboardMock = () => (
  <div className="grid grid-cols-12 gap-4 p-4 md:p-6">
    <aside className="hidden md:flex col-span-2 flex-col gap-1.5">
      {["Overview", "Properties", "Tenants", "Rooms", "Billing", "Reports", "Settings"].map((i, idx) => (
        <div key={i} className={`px-3 py-2 rounded-lg text-xs font-medium font-alt tracking-wide ${idx === 0 ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground transition-smooth"}`}>{i}</div>
      ))}
    </aside>
    <div className="col-span-12 md:col-span-10 space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statCards.map((k) => (
          <div key={k.l} className="rounded-xl border border-border/40 bg-background/30 p-3 transition-smooth hover:bg-background/50">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">{k.l}</div>
            <div className="mt-1 text-xl md:text-2xl font-bold font-display">{k.v}</div>
            <div className={`text-[10px] font-medium mt-1 ${k.d.startsWith("+") ? "text-primary" : "text-destructive"}`}>{k.d}</div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="md:col-span-2 rounded-xl border border-border/40 bg-background/30 p-4 h-48">
          <div className="text-xs font-medium font-display mb-3 tracking-wide">Revenue · last 6 months</div>
          <div className="flex items-end gap-2 h-32">
            {[40, 65, 50, 78, 72, 92].map((h, i) => (
              <div key={i} className="flex-1 rounded-t-md bg-gradient-primary opacity-70 hover:opacity-100 transition-smooth cursor-pointer" style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-border/40 bg-background/30 p-4 h-48">
          <div className="text-xs font-medium font-display mb-3 tracking-wide">Recent transactions</div>
          <div className="space-y-2">
            {[["Sara M.", "+₹1,200"], ["Apt 4B", "+₹950"], ["John D.", "−₹50"], ["Tower A", "+₹2,100"]].map(([n, a]) => (
              <div key={n} className="flex items-center justify-between text-xs py-0.5">
                <span className="text-muted-foreground font-alt">{n}</span>
                <span className={`font-medium ${a.startsWith("+") ? "text-primary dark:text-primary" : "text-destructive"}`}>{a}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

function SkylineCanvas({ containerRef }: { containerRef: React.RefObject<HTMLDivElement | null> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let particles: { x: number; y: number; size: number; speedX: number; speedY: number; alpha: number; life: number }[] = [];
    const MAX_PARTICLES = 60;

    const resize = () => {
      if (!containerRef.current) return;
      canvas.width = containerRef.current.offsetWidth;
      canvas.height = containerRef.current.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // Generate a burst of particles
    const spawnParticle = () => {
      if (particles.length >= MAX_PARTICLES) return;
      particles.push({
        x: Math.random() * canvas.width,
        y: canvas.height * (0.3 + Math.random() * 0.4),
        size: 1 + Math.random() * 2.5,
        speedX: (Math.random() - 0.5) * 0.3,
        speedY: -0.15 - Math.random() * 0.3,
        alpha: 0.3 + Math.random() * 0.7,
        life: 0,
      });
    };
    // Initial burst
    for (let i = 0; i < 30; i++) spawnParticle();

    const isDark = () => document.documentElement.classList.contains("dark");

    const seededRandom = (seed: number) => {
      const s = Math.sin(seed * 9301 + 49297) * 49297;
      return s - Math.floor(s);
    };

    const drawBuilding = (x: number, w: number, h: number, color: string) => {
      ctx.fillStyle = color;
      ctx.fillRect(x, canvas.height - h, w, h);
      // Windows — deterministic pattern per building (no flickering)
      ctx.fillStyle = isDark() ? "rgba(255,215,0,0.15)" : "rgba(26,26,78,0.12)";
      const cols = Math.max(1, Math.floor(w / 18));
      const rows = Math.max(1, Math.floor(h / 20));
      for (let r = 0; r < rows && r < 12; r++) {
        for (let c = 0; c < cols && c < 6; c++) {
          if (seededRandom(x * 1000 + r * 7 + c * 13) > 0.3) {
            ctx.fillRect(x + 4 + c * 16, canvas.height - h + 6 + r * 18, 8, 10);
          }
        }
      }
    };

    const drawDome = (cx: number, baseY: number, r: number, color: string) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(cx, baseY, r, Math.PI, 0);
      ctx.fill();
    };

    const drawMinaret = (x: number, baseY: number, h: number, color: string) => {
      ctx.fillStyle = color;
      ctx.fillRect(x - 3, baseY - h, 6, h);
      // Spire
      ctx.beginPath();
      ctx.moveTo(x - 4, baseY - h);
      ctx.lineTo(x, baseY - h - 12);
      ctx.lineTo(x + 4, baseY - h);
      ctx.fill();
    };

    const drawTaj = (x: number, baseY: number, color: string) => {
      const s = Math.min(60, (canvas.width - x) / 4);
      // Main body
      ctx.fillStyle = color;
      ctx.fillRect(x - s * 0.4, baseY - s * 1.2, s * 0.8, s * 1.2);
      // Arch
      ctx.fillStyle = isDark() ? "rgba(240,240,250,0.06)" : "rgba(26,26,78,0.08)";
      ctx.beginPath();
      ctx.ellipse(x, baseY - s * 0.7, s * 0.25, s * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();
      // Dome
      ctx.fillStyle = color;
      drawDome(x, baseY - s * 1.2, s * 0.35, color);
      // Spire
      ctx.beginPath();
      ctx.moveTo(x - 3, baseY - s * 1.55);
      ctx.lineTo(x, baseY - s * 1.7);
      ctx.lineTo(x + 3, baseY - s * 1.55);
      ctx.fill();
    };

    const drawHawaMahal = (x: number, baseY: number, color: string) => {
      const w = 70;
      const h = 90;
      ctx.fillStyle = color;
      ctx.fillRect(x, baseY - h, w, h);
      // Small arched windows
      ctx.fillStyle = isDark() ? "rgba(255,215,0,0.12)" : "rgba(26,26,78,0.1)";
      for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 5; col++) {
          const wx = x + 5 + col * 13;
          const wy = baseY - h + 8 + row * 17;
          ctx.beginPath();
          ctx.arc(wx + 4, wy + 4, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      // Top arches
      for (let i = 0; i < 5; i++) {
        const cx = x + 7 + i * 13;
        ctx.beginPath();
        ctx.arc(cx, baseY - h + 5, 5, Math.PI, 0);
        ctx.fillStyle = color;
        ctx.fill();
      }
    };

    const drawQutub = (x: number, baseY: number, color: string) => {
      const w = 24;
      const h = 110;
      ctx.fillStyle = color;
      ctx.fillRect(x - 2, baseY - h, w, h);
      // Horizontal bands
      ctx.fillStyle = isDark() ? "rgba(255,215,0,0.08)" : "rgba(26,26,78,0.06)";
      for (let i = 0; i < 6; i++) {
        ctx.fillRect(x - 2, baseY - h + i * 18, w, 3);
      }
      // Top
      ctx.beginPath();
      ctx.arc(x + 10, baseY - h, 8, Math.PI, 0);
      ctx.fillStyle = color;
      ctx.fill();
    };

    const drawIndiaGate = (x: number, baseY: number, color: string) => {
      const w = 80;
      const h = 65;
      ctx.fillStyle = color;
      ctx.fillRect(x, baseY - h, w, h);
      // Arch
      ctx.fillStyle = isDark() ? "rgba(240,240,250,0.06)" : "rgba(26,26,78,0.08)";
      ctx.beginPath();
      ctx.ellipse(x + w / 2, baseY - h * 0.55, w * 0.22, h * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();
      // Top
      ctx.fillStyle = color;
      ctx.fillRect(x + 10, baseY - h - 6, w - 20, 6);
    };

    let frame = 0;

    const animate = () => {
      frame++;
      if (!containerRef.current) return;
      const isD = isDark();
      const gradColor1 = isD ? "rgba(5,5,30,1)" : "rgba(245,235,220,1)";
      const gradColor2 = isD ? "rgba(8,8,40,1)" : "rgba(235,220,200,1)";
      const silhouetteColor = isD ? "rgba(15,15,50,0.35)" : "rgba(26,26,78,0.08)";
      const goldGlow = isD ? "rgba(255,215,0,0.04)" : "rgba(26,26,78,0.03)";

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Gradient background at bottom
      const grad = ctx.createLinearGradient(0, canvas.height * 0.75, 0, canvas.height);
      grad.addColorStop(0, goldGlow);
      grad.addColorStop(1, gradColor1);
      ctx.fillStyle = grad;
      ctx.fillRect(0, canvas.height * 0.75, canvas.width, canvas.height * 0.25);

      // Draw Indian landmarks across the horizon
      const baseY = canvas.height;
      const spacing = canvas.width / 6;

      drawTaj(spacing * 0.5, baseY, silhouetteColor);
      drawHawaMahal(spacing * 1.3, baseY, silhouetteColor);
      drawQutub(spacing * 2.3, baseY, silhouetteColor);
      drawIndiaGate(spacing * 3.3, baseY, silhouetteColor);

      // Generic buildings to fill gaps (deterministic sizes per index)
      for (let i = 0; i < 8; i++) {
        const bx = spacing * 0.1 + i * (canvas.width / 8);
        const bw = 20 + seededRandom(i * 7 + 1) * 30;
        const bh = 40 + seededRandom(i * 13 + 3) * 70;
        if (i === 4 || i === 6) continue; // skip where landmarks are
        drawBuilding(bx, bw, bh, silhouetteColor);
      }
      // Minarets
      drawMinaret(spacing * 0.7, baseY, 80, silhouetteColor);
      drawMinaret(spacing * 2.1, baseY, 65, silhouetteColor);

      // Update and draw particles
      if (frame % 8 === 0) spawnParticle();
      particles = particles.filter((p) => p.life < 300);
      for (const p of particles) {
        p.x += p.speedX;
        p.y += p.speedY;
        p.life++;
        const fadeOut = Math.max(0, 1 - p.life / 300);
        const twinkle = 0.7 + 0.3 * Math.sin(p.life * 0.05 + p.x);
        ctx.fillStyle = isD
          ? `rgba(255,215,0,${p.alpha * fadeOut * twinkle * 0.6})`
          : `rgba(26,26,78,${p.alpha * fadeOut * twinkle * 0.15})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      animId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, [containerRef]);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden />;
}

export const Hero = () => {
  const nav = useNavigate();
  const heroRef = useRef<HTMLDivElement>(null);
  return (
    <section ref={heroRef} className="relative pt-32 pb-20 md:pt-44 md:pb-28 overflow-hidden bg-sunset bg-skyline">
      <SkylineCanvas containerRef={heroRef} />
      <div className="absolute inset-0 pattern-jaali opacity-40" aria-hidden />
      {/* Golden sparkle accents */}
      <div className="absolute top-8 left-[8%] sparkle-dot opacity-60" style={{ animationDelay: "0.5s" }} />
      <div className="absolute top-16 right-[12%] sparkle-dot opacity-40" style={{ animationDelay: "1.8s" }} />
      <div className="absolute top-32 left-[45%] sparkle-dot opacity-50" style={{ animationDelay: "3.2s" }} />
      <div className="absolute top-1/4 left-1/3 h-96 w-96 bg-primary/20 blur-[150px] rounded-full animate-pulse-glow" aria-hidden />
      <div className="absolute bottom-0 right-1/4 h-64 w-64 bg-primary/10 blur-[100px] rounded-full" aria-hidden />
      <div className="absolute top-1/3 right-1/4 h-48 w-48 bg-primary/10 blur-[120px] rounded-full animate-pulse-glow" aria-hidden style={{ animationDelay: "1s" }} />
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
          <h1 className="font-display text-4xl sm:text-5xl md:text-7xl font-bold leading-[1.08] tracking-tight text-premium-shimmer">
            Manage every property with{" "}
            <span className="text-gold-shimmer bg-clip-text">royal command.</span>
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
            <Button variant="outline" size="xl" className="w-full sm:w-auto text-base" onClick={() => nav("/properties")}>
              <Home className="h-4 w-4 mr-1" />
              Browse Properties
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
                <div className="h-3 w-3 rounded-full bg-primary/60" />
                <div className="h-3 w-3 rounded-full bg-accent/60" />
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
