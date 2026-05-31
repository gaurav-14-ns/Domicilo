import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Crown } from "lucide-react";

const faqs = [
  { q: "Can I separate owner and tenant access?", a: "Absolutely. Domicilo ships with two distinct portals, role-aware routing, and row-level security so tenants only ever see what concerns them." },
  { q: "How does pausing billing work?", a: "Pick any tenant, choose rent / water / electricity, and set start and end dates. Billing automatically resumes after the pause window — no manual intervention needed." },
  { q: "What happens when I deactivate a tenant?", a: "They lose access immediately and stop being billed, but all historical records remain for audit. You can permanently archive after the grace period." },
  { q: "Is there a mobile app?", a: "Domicilo is a fully responsive PWA — install it on your iOS or Android home screen for a native-like experience, no app store required." },
  { q: "Do you offer an admin dashboard?", a: "Yes — our Scale plan includes a multi-tenant admin dashboard for managing organizations, users, and billing across your entire portfolio." },
];

export const FAQ = () => (
  <section id="faq" className="py-24 md:py-32 relative pattern-jaali">
    <div className="absolute top-0 left-0 right-0 divider-royal" aria-hidden />
    <div className="container max-w-3xl">
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary mb-3 font-display">
          <Crown className="h-3.5 w-3.5" />
          FAQ
        </div>
        <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight">Questions, answered royally.</h2>
        <p className="mt-3 text-muted-foreground font-alt">Everything you need to know about Domicilo.</p>
      </div>
      <Accordion type="single" collapsible className="w-full">
        {faqs.map((f, i) => (
          <AccordionItem key={i} value={`item-${i}`} className="border-border/60">
            <AccordionTrigger className="text-left font-display font-semibold hover:no-underline hover:text-primary transition-smooth">{f.q}</AccordionTrigger>
            <AccordionContent className="text-muted-foreground leading-relaxed font-alt">{f.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  </section>
);
