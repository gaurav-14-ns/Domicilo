import { Check, Crown, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ContactDialog } from "./ContactDialog";
import { PLAN_PRICES_INR, formatMoney } from "@/lib/currency";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { UpgradePlaceholderDialog } from "./UpgradePlaceholderDialog";
import { AnimatedSection, AnimatedStagger } from "./AnimatedSection";
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
    desc: "Perfect for solo owners beginning their journey.",
    features: ["Up to 25 tenants", "1 property", "Owner & tenant portals", "Email support", "14-day free trial"],
    cta: "Start Free Trial",
    variant: "outline",
    action: "signup",
  },
  {
    id: "growth",
    name: "Growth",
    desc: "For growing portfolios that demand royal treatment.",
    features: ["Up to 250 tenants", "Unlimited properties", "Pause billing & reports", "Transaction exports", "Priority support", "Multi-currency"],
    cta: "Upgrade to Growth",
    variant: "hero",
    featured: true,
    action: "subscribe",
  },
  {
    id: "scale",
    name: "Scale",
    desc: "Multi-region operators & enterprise estates.",
    features: ["Unlimited tenants & properties", "Admin dashboard & roles", "API access & webhooks", "SSO & audit logs", "Dedicated CSM", "Custom integrations"],
    cta: "Contact Sales",
    variant: "outline",
    action: "contact",
  },
];

export const Pricing = () => {
  const nav = useNavigate();
  const { user, role } = useAuth();
  const { subscription } = useSubscription();

  const handleStarter = () => {
    if (!user) { nav("/auth"); return; }
    if (role !== "owner") { toast.info("Subscriptions are for property owners only."); return; }
    if (subscription?.status === "trial") {
      toast.info("You're already on the Starter trial.");
      nav("/owner");
      return;
    }
    nav("/owner");
  };

  const isCurrent = (id: PlanId) =>
    subscription?.plan === id && subscription.status === "active";

  return (
    <section id="pricing" className="py-24 md:py-32 relative bg-sunset bg-skyline">
      <div className="absolute top-0 left-0 right-0 divider-royal" aria-hidden />
      <div className="container relative">
        <AnimatedSection className="max-w-2xl mx-auto text-center mb-16">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary mb-3 font-display">
            <Crown className="h-3.5 w-3.5" />
            Pricing
          </div>
          <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight">Royal plans, honest pricing.</h2>
          <p className="mt-4 text-muted-foreground text-lg font-alt">
            Start your 14-day royal trial. Upgrade when your portfolio demands it. All prices in Indian Rupees (₹).
          </p>
        </AnimatedSection>
        <AnimatedStagger
          className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto"
          baseDelay={150}
          staggerMs={120}
        >
          {tiers.map((t) => {
            const price = t.id === "scale" ? "Custom" : formatMoney(PLAN_PRICES_INR[t.id]);
            const isCustom = t.id === "scale";
            const current = isCurrent(t.id);
            const btnLabel = current ? "Current plan" : t.cta;
            return (
              <div
                key={t.id}
                className={`relative rounded-2xl border p-8 transition-smooth ${
                  t.featured
                    ? "border-primary/40 bg-gradient-card shadow-elegant scale-[1.02] md:scale-105"
                    : "border-border/60 bg-background hover:border-primary/30 hover:shadow-elegant"
                }`}
              >
                {t.featured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-semibold bg-gradient-primary text-primary-foreground shadow-md flex items-center gap-1.5">
                    <Sparkles className="h-3 w-3" />
                    Most popular
                  </div>
                )}
                <div className="font-display font-semibold text-lg flex items-center gap-2">
                  {t.featured && <Crown className="h-4 w-4 text-primary" />}
                  {t.name}
                </div>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-bold font-display">{price}</span>
                  {!isCustom && <span className="text-muted-foreground font-alt">/month</span>}
                </div>
                <p className="mt-2 text-sm text-muted-foreground font-alt">{t.desc}</p>
                {t.action === "contact" ? (
                  <ContactDialog
                    variant="sales"
                    context={t.name}
                    trigger={<Button variant={t.variant} className="w-full mt-6 shadow-glow">{t.cta}</Button>}
                  />
                ) : t.action === "subscribe" ? (
                  user && role === "owner" && !current ? (
                    <UpgradePlaceholderDialog
                      plan={t.id}
                      planLabel={t.name}
                      onActivated={() => nav("/owner")}
                      trigger={<Button variant={t.variant} className="w-full mt-6 shadow-glow">{btnLabel}</Button>}
                    />
                  ) : (
                    <Button
                      variant={t.variant}
                      className="w-full mt-6"
                      onClick={() => {
                        if (!user) { nav("/auth"); return; }
                        if (role !== "owner") { toast.info("Subscriptions are for property owners only."); return; }
                      }}
                      disabled={current}
                    >
                      {btnLabel}
                    </Button>
                  )
                ) : (
                  <Button
                    variant={t.variant}
                    className="w-full mt-6 shadow-glow"
                    onClick={handleStarter}
                    disabled={current}
                  >
                    {btnLabel}
                  </Button>
                )}
                <ul className="mt-6 space-y-3">
                  {t.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm">
                      <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span className="font-alt">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </AnimatedStagger>
      </div>
    </section>
  );
};
