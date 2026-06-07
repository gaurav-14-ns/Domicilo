import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Building2, Globe, ShieldCheck, Crown } from "lucide-react";

export default function About() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-24 pb-16">
        <div className="container max-w-4xl space-y-12 animate-page-enter">
          <header className="text-center space-y-4">
            <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-primary/10 text-primary mb-2">
              <Crown className="h-7 w-7" />
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight text-gradient">About Domicilo</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-alt">
              We are building the royal operating system that modern Indian property managers actually deserve —
              calm, fast, and beautifully designed.
            </p>
          </header>

          <section className="grid md:grid-cols-2 gap-6">
            {[
              { icon: Building2, t: "Built for Indian portfolios", d: "From a single building to thousands of doors, the same elegant workflow scales with you." },
              { icon: Globe, t: "India-first, global-ready", d: "Local currency, locale-aware formatting, and clear language for every region." },
              { icon: ShieldCheck, t: "Security first", d: "Row-level security, encrypted at rest, and strict role-based access for every royal account." },
              { icon: Crown, t: "Premium by default", d: "No ads, no upsells, no fluff. Just the royal tools that move your business forward." },
            ].map((c) => (
              <div key={c.t} className="card-premium">
                <c.icon className="h-6 w-6 text-primary mb-3" />
                <div className="font-display font-semibold text-lg">{c.t}</div>
                <p className="text-sm text-muted-foreground mt-1 font-alt">{c.d}</p>
              </div>
            ))}
          </section>

          <section className="rounded-2xl border border-border/60 bg-gradient-card p-8 md:p-10 text-center space-y-4 shadow-elegant">
            <div className="divider-royal w-20 mx-auto" />
            <h2 className="font-display text-2xl font-semibold tracking-tight text-gradient">Our royal mission</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto font-alt">
              Property management has been stuck in spreadsheets and clunky software for decades.
              Domicilo gives Indian operators a single source of truth — properties, tenants, billing, and
              reports — so they can focus on what actually matters: their residents.
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <Link to="/auth"><Button variant="hero" className="shadow-glow">Start royal trial</Button></Link>
              <Link to="/contact"><Button variant="outline">Talk to us</Button></Link>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
