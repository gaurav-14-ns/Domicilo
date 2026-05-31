import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqs = [
  { q: "Can I separate owner and tenant access?", a: "Yes. Domicilo ships with two distinct portals, role-aware routing, and row-level security so tenants only ever see what concerns them." },
  { q: "How does pausing billing work?", a: "Pick any tenant, choose rent / water / electricity, and set a start and end date. Billing automatically resumes after the pause window." },
  { q: "What happens when I deactivate a tenant?", a: "They lose access immediately and stop being billed, but historical records are kept for audit. You can permanently delete them after the grace period." },
  { q: "Is there a mobile app?", a: "Domicilo is a fully responsive web app, installable as a PWA on iOS and Android — no app store required." },
  { q: "Do you offer an admin dashboard?", a: "Yes — Scale plan includes a multi-tenant admin dashboard for managing organizations, users, and billing across your portfolio." },
];

export const FAQ = () => (
  <section id="faq" className="py-24 md:py-32">
    <div className="container max-w-3xl">
      <div className="text-center mb-12">
        <div className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">FAQ</div>
        <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Questions, answered.</h2>
      </div>
      <Accordion type="single" collapsible className="w-full">
        {faqs.map((f, i) => (
          <AccordionItem key={i} value={`item-${i}`} className="border-border">
            <AccordionTrigger className="text-left font-display font-semibold hover:no-underline hover:text-primary">{f.q}</AccordionTrigger>
            <AccordionContent className="text-muted-foreground leading-relaxed">{f.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  </section>
);
