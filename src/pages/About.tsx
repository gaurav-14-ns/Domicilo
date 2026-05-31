import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Building2, Globe, ShieldCheck, Sparkles } from "lucide-react";

export default function About() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-24 pb-16">
        <div className="container max-w-4xl space-y-12">
          <header className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-display font-bold">About Domicilo</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              We're building the operating system that modern property managers actually deserve —
              calm, fast, and beautifully designed.
            </p>
          </header>

          <section className="grid md:grid-cols-2 gap-6">
            {[
              { icon: Building2, t: "Built for portfolios", d: "From a single building to thousands of doors, the same elegant workflow scales with you." },
              { icon: Globe, t: "Truly global", d: "Local currency, locale-aware formatting, and clear language across every region." },
              { icon: ShieldCheck, t: "Security first", d: "Row-level security, encrypted at rest, and strict role-based access for every account." },
              { icon: Sparkles, t: "Premium by default", d: "No ads, no upsells, no fluff. Just the tools that move your business forward." },
            ].map((c) => (
              <div key={c.t} className="rounded-xl border border-border bg-gradient-card p-6">
                <c.icon className="h-6 w-6 text-primary mb-3" />
                <div className="font-display font-semibold text-lg">{c.t}</div>
                <p className="text-sm text-muted-foreground mt-1">{c.d}</p>
              </div>
            ))}
          </section>

          <section className="rounded-2xl border border-border bg-gradient-card p-8 text-center space-y-4">
            <h2 className="text-2xl font-display font-semibold">Our mission</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Property management has been stuck in spreadsheets and clunky software for decades.
              Domicilo gives operators a single source of truth — properties, tenants, billing, and
              reports — so they can focus on what actually matters: their residents.
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <Link to="/auth"><Button variant="hero">Start free</Button></Link>
              <Link to="/contact"><Button variant="outline">Talk to us</Button></Link>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
