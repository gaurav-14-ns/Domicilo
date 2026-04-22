import { Building2, Users, DoorOpen, Receipt, PauseCircle, BarChart3, ShieldCheck, Smartphone } from "lucide-react";

const features = [
  { icon: Building2, title: "Multi-property control", desc: "Manage unlimited buildings, blocks, and units from one elegant workspace." },
  { icon: DoorOpen, title: "Smart room allocation", desc: "Drag-drop room assignments with live occupancy and bed-level visibility." },
  { icon: Users, title: "Tenant lifecycle", desc: "Onboard, manage, deactivate, then delete — full GDPR-compliant flow." },
  { icon: Receipt, title: "Transaction logs", desc: "Every rupee accounted for. Searchable, exportable, audit-ready ledgers." },
  { icon: PauseCircle, title: "Pause billing by date", desc: "Hold rent, water, or electricity charges between any two dates per tenant." },
  { icon: BarChart3, title: "Owner KPI dashboard", desc: "Occupancy, revenue, dues, churn — your business in a single glance." },
  { icon: ShieldCheck, title: "Owner & tenant logins", desc: "Separate, role-aware portals with row-level security baked in." },
  { icon: Smartphone, title: "Mobile-first design", desc: "Pixel-perfect on every device. Manage your portfolio from the lobby." },
];

export const Features = () => (
  <section id="features" className="py-24 md:py-32">
    <div className="container">
      <div className="max-w-2xl mb-16">
        <div className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">Platform</div>
        <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Everything property operators wish they had.</h2>
        <p className="mt-4 text-muted-foreground text-lg">Built with operators, for operators. No bloat, no spreadsheets, no missed payments.</p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {features.map((f, i) => (
          <div
            key={f.title}
            className="group relative rounded-2xl border border-border bg-gradient-card p-6 hover:border-primary/40 hover:-translate-y-1 transition-smooth"
            style={{ animationDelay: `${i * 0.05}s` }}
          >
            <div className="h-11 w-11 grid place-items-center rounded-xl bg-primary/10 text-primary mb-4 group-hover:bg-gradient-primary group-hover:text-primary-foreground transition-smooth">
              <f.icon className="h-5 w-5" />
            </div>
            <h3 className="font-display font-semibold text-base mb-1.5">{f.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);
