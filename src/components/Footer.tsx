import { Building2 } from "lucide-react";

export const Footer = () => (
  <footer className="border-t border-border py-12">
    <div className="container">
      <div className="grid md:grid-cols-4 gap-8 mb-10">
        <div>
          <a href="#" className="flex items-center gap-2 font-display font-bold text-lg mb-3">
            <span className="grid place-items-center h-9 w-9 rounded-xl bg-gradient-primary">
              <Building2 className="h-5 w-5 text-primary-foreground" />
            </span>
            Domicilo
          </a>
          <p className="text-sm text-muted-foreground max-w-xs">
            The premium operating system for modern property managers.
          </p>
        </div>
        {[
          { h: "Product", l: ["Features", "Pricing", "Changelog", "Roadmap"] },
          { h: "Company", l: ["About", "Customers", "Careers", "Contact"] },
          { h: "Legal", l: ["Privacy", "Terms", "Security", "DPA"] },
        ].map((c) => (
          <div key={c.h}>
            <div className="font-display font-semibold text-sm mb-3">{c.h}</div>
            <ul className="space-y-2">
              {c.l.map((i) => (
                <li key={i}><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-smooth">{i}</a></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-xs text-muted-foreground">© 2026 Domicilo Labs Inc. All rights reserved.</p>
        <p className="text-xs text-muted-foreground">Crafted with care for property operators worldwide.</p>
      </div>
    </div>
  </footer>
);
