import { Building2, Users, DoorOpen, Receipt, PauseCircle, BarChart3, ShieldCheck, Smartphone } from "lucide-react";

const features = [
  { icon: Building2, title: "Multi-property command", desc: "Manage unlimited buildings, blocks, and units from one elegant royal workspace." },
  { icon: DoorOpen, title: "Regal room allocation", desc: "Drag-drop room assignments with live occupancy and unit-level visibility across your estate." },
  { icon: Users, title: "Tenant lifecycle", desc: "Onboard, manage, pause, deactivate — a complete, audit-ready flow fit for royalty." },
  { icon: Receipt, title: "Transaction ledgers", desc: "Every rupee accounted. Searchable, exportable, audit-ready — no more spreadsheets." },
  { icon: PauseCircle, title: "Pause billing by date", desc: "Hold rent, water, or electricity charges between any two dates per tenant, effortlessly." },
  { icon: BarChart3, title: "Imperial KPI dashboards", desc: "Occupancy, revenue, dues, churn — your entire portfolio in a single royal glance." },
  { icon: ShieldCheck, title: "Role-locked portals", desc: "Separate owner, tenant, and admin dashboards with row-level security built in." },
  { icon: Smartphone, title: "Mobile-first elegance", desc: "Pixel-perfect on every device. Manage your estate from anywhere, at any time." },
];

export const Features = () => (
  <section id="features" className="py-24 md:py-32 relative pattern-jaali">
    <div className="absolute top-0 left-0 right-0 divider-royal" aria-hidden />
    <div className="container">
      <div className="max-w-2xl mb-16">
        <div className="text-xs font-semibold uppercase tracking-widest text-primary mb-3 font-display">Platform</div>
        <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight">Everything property operators wish they had.</h2>
        <p className="mt-4 text-muted-foreground text-lg font-alt">Built with Indian property operators, for Indian property operators. No bloat, no spreadsheets, no missed payments.</p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {features.map((f, i) => (
          <div
            key={f.title}
            className="group relative rounded-2xl border border-border/60 bg-gradient-card p-6 hover:border-primary/30 hover:-translate-y-1 transition-smooth hover:shadow-elegant"
            style={{ animationDelay: `${i * 0.05}s` }}
          >
            <div className="h-11 w-11 grid place-items-center rounded-xl bg-primary/10 text-primary mb-4 group-hover:bg-gradient-primary group-hover:text-primary-foreground transition-smooth">
              <f.icon className="h-5 w-5" />
            </div>
            <h3 className="font-display font-semibold text-base mb-1.5">{f.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed font-alt">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);
