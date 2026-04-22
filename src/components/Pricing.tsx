import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ContactDialog } from "./ContactDialog";

const tiers = [
  {
    name: "Starter",
    price: "$29",
    period: "/mo",
    desc: "Solo owners with a single building.",
    features: ["Up to 25 tenants", "1 property", "Owner & tenant portals", "Email support"],
    cta: "Start free",
    variant: "outline" as const,
    action: "signup" as const,
  },
  {
    name: "Growth",
    price: "$89",
    period: "/mo",
    desc: "For growing portfolios that need more power.",
    features: ["Up to 250 tenants", "Unlimited properties", "Pause billing & reports", "Transaction exports", "Priority support"],
    cta: "Choose Growth",
    variant: "hero" as const,
    featured: true,
    action: "signup" as const,
  },
  {
    name: "Scale",
    price: "Custom",
    period: "",
    desc: "Multi-region operators & PropTech teams.",
    features: ["Unlimited tenants", "Admin dashboard & roles", "API access", "SSO & audit logs", "Dedicated CSM"],
    cta: "Talk to sales",
    variant: "outline" as const,
    action: "contact" as const,
  },
];

export const Pricing = () => {
  const nav = useNavigate();
  return (
    <section id="pricing" className="py-24 md:py-32 bg-muted/30">
      <div className="container">
        <div className="max-w-2xl mx-auto text-center mb-16">
          <div className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">Pricing</div>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Simple plans. Honest pricing.</h2>
          <p className="mt-4 text-muted-foreground text-lg">Start free for 14 days. Upgrade when you're ready. No hidden fees, ever.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {tiers.map((t) => (
            <div
              key={t.name}
              className={`relative rounded-2xl border p-8 transition-smooth ${
                t.featured
                  ? "border-primary bg-gradient-card shadow-elegant scale-[1.02] md:scale-105"
                  : "border-border bg-background hover:border-primary/40"
              }`}
            >
              {t.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-semibold bg-gradient-primary text-primary-foreground shadow-md">
                  Most popular
                </div>
              )}
              <div className="font-display font-semibold text-lg">{t.name}</div>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-bold font-display">{t.price}</span>
                <span className="text-muted-foreground">{t.period}</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{t.desc}</p>
              {t.action === "signup" ? (
                <Button variant={t.variant} className="w-full mt-6" onClick={() => nav("/auth")}>{t.cta}</Button>
              ) : (
                <ContactDialog
                  variant="sales"
                  context={t.name}
                  trigger={<Button variant={t.variant} className="w-full mt-6">{t.cta}</Button>}
                />
              )}
              <ul className="mt-6 space-y-3">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
