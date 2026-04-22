import { Building2 } from "lucide-react";
import { Link } from "react-router-dom";

const sections = [
  { h: "Product", l: [
    { label: "Features", href: "/#features" },
    { label: "Pricing", href: "/#pricing" },
    { label: "FAQ", href: "/#faq" },
    { label: "Sign in", href: "/auth" },
  ]},
  { h: "Company", l: [
    { label: "About", href: "/#features" },
    { label: "Contact", href: "/auth" },
  ]},
  { h: "Legal", l: [
    { label: "Privacy", href: "/#" },
    { label: "Terms", href: "/#" },
  ]},
];

export const Footer = () => (
  <footer className="border-t border-border py-12">
    <div className="container">
      <div className="grid md:grid-cols-4 gap-8 mb-10">
        <div>
          <Link to="/" className="flex items-center gap-2 font-display font-bold text-lg mb-3">
            <span className="grid place-items-center h-9 w-9 rounded-xl bg-gradient-primary">
              <Building2 className="h-5 w-5 text-primary-foreground" />
            </span>
            Domicilo
          </Link>
          <p className="text-sm text-muted-foreground max-w-xs">
            The premium operating system for modern property managers.
          </p>
        </div>
        {sections.map((c) => (
          <div key={c.h}>
            <div className="font-display font-semibold text-sm mb-3">{c.h}</div>
            <ul className="space-y-2">
              {c.l.map((i) => (
                <li key={i.label}>
                  <Link to={i.href} className="text-sm text-muted-foreground hover:text-foreground transition-smooth">{i.label}</Link>
                </li>
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
