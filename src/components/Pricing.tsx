import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ContactDialog } from "./ContactDialog";
import { useCurrency } from "@/hooks/useCurrency";
import { planPriceIn } from "@/lib/currency";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { UpgradePlaceholderDialog } from "./UpgradePlaceholderDialog";
import { toast } from "sonner";
import type { PlanId } from "@/lib/currency";

interface Tier {
  id: PlanId;
  name: string;
  desc: string;
  features: string[];
  cta: string;
  variant: "outline" | "hero";
  featured?: boolean;
  action: "signup" | "subscribe" | "contact";
}

const tiers: Tier[] = [
  {
    id: "starter",
    name: "Starter",
    desc: "Solo owners with a single building.",
    features: ["Up to 25 tenants", "1 property", "Owner & tenant portals", "Email support"],
    cta: "Start free",
    variant: "outline",
    action: "signup",
  },
  {
    id: "growth",
    name: "Growth",
    desc: "For growing portfolios that need more power.",
    features: ["Up to 250 tenants", "Unlimited properties", "Pause billing & reports", "Transaction exports", "Priority support"],
    cta: "Choose Growth",
    variant: "hero",
    featured: true,
    action: "subscribe",
  },
  {
    id: "scale",
    name: "Scale",
    desc: "Multi-region operators & PropTech teams.",
    features: ["Unlimited tenants", "Admin dashboard & roles", "API access", "SSO & audit logs", "Dedicated CSM"],
    cta: "Talk to sales",
    variant: "outline",
    action: "contact",
  },
];

export const Pricing = () => {
  const nav = useNavigate();
  const { code, locale } = useCurrency();
  const { user, role } = useAuth();
  const { subscription, changePlan } = useSubscription();

  const handleClick = async (t: Tier) => {
    if (t.action === "contact") return; // handled by ContactDialog wrapper
    if (!user) {
      nav("/auth");
      return;
    }
    if (role !== "owner") {
      toast.info("Subscriptions are for property owners only.");
      return;
    }
    if (t.id === "starter" && subscription?.status === "trial") {
      toast.info("You're already on the Starter trial.");
      nav("/owner");
      return;
    }
    try {
      await changePlan(t.id);
      toast.success(`${t.name} plan activated`);
      nav("/owner");
    } catch (err: any) {
      toast.error("Couldn't change plan", { description: err.message });
    }
  };

  return (
    <section id="pricing" className="py-24 md:py-32 bg-muted/30">
      <div className="container">
        <div className="max-w-2xl mx-auto text-center mb-16">
          <div className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">Pricing</div>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Simple plans. Honest pricing.</h2>
          <p className="mt-4 text-muted-foreground text-lg">
            Start free for 14 days. Upgrade when you're ready. Prices auto-localized to your region.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {tiers.map((t) => {
            const price = planPriceIn(t.id, code, locale);
            const isCustom = t.id === "scale";
            return (
              <div
                key={t.id}
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
                  <span className="text-4xl font-bold font-display">{price}</span>
                  {!isCustom && <span className="text-muted-foreground">/mo</span>}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{t.desc}</p>
                {t.action === "contact" ? (
                  <ContactDialog
                    variant="sales"
                    context={t.name}
                    trigger={<Button variant={t.variant} className="w-full mt-6">{t.cta}</Button>}
                  />
                ) : (
                  <Button variant={t.variant} className="w-full mt-6" onClick={() => handleClick(t)}>
                    {subscription?.plan === t.id && subscription.status === "active"
                      ? "Current plan"
                      : t.cta}
                  </Button>
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
            );
          })}
        </div>
      </div>
    </section>
  );
};
