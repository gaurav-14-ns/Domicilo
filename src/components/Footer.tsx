import { Crown } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";

const sections = [
  { h: "Product", l: [
    { label: "Features", href: "/#features" },
    { label: "Pricing", href: "/#pricing" },
    { label: "FAQ", href: "/#faq" },
    { label: "Sign in", href: "/auth" },
  ]},
  { h: "Company", l: [
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
  ]},
  { h: "Legal", l: [
    { label: "Privacy", href: "/privacy" },
    { label: "Terms", href: "/terms" },
  ]},
];

export const Footer = () => {
  const loc = useLocation();
  const nav = useNavigate();

  const onHashClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (!href.includes("#")) return;
    const [path, hash] = href.split("#");
    if ((path === "/" || path === "") && loc.pathname === "/") {
      e.preventDefault();
      const el = document.getElementById(hash);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      e.preventDefault();
      nav(href);
      requestAnimationFrame(() => {
        const el = document.getElementById(hash);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  };

  return (
    <footer className="border-t border-border/60 pt-16 pb-8 relative">
      <div className="absolute top-0 left-0 right-0 divider-royal" aria-hidden />
      <div className="container">
        <div className="grid md:grid-cols-[1.4fr_1fr_1fr_1fr] gap-10 mb-12 items-start">
          <div className="flex flex-col items-start max-w-xs">
            <div className="flex items-center gap-3 mb-4">
              <img
                src="/favicon.png"
                alt="Domicilo"
                className="h-12 w-12 rounded-xl object-cover shadow-glow"
              />
              <span className="font-display text-xl font-bold tracking-wide">Domicilo</span>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed font-alt">
              The premium royal operating system for modern Indian property managers.
            </p>
            <div className="flex items-center gap-1.5 mt-4 text-xs text-muted-foreground">
              <Crown className="h-3 w-3 text-primary" />
              Crafted with care for property operators
            </div>
          </div>
          {sections.map((c) => (
            <div key={c.h}>
              <div className="font-display font-semibold text-sm mb-3 tracking-wide">{c.h}</div>
              <ul className="space-y-2.5">
                {c.l.map((i) => (
                  <li key={i.label}>
                    <Link
                      to={i.href}
                      onClick={(e) => onHashClick(e, i.href)}
                      className="text-sm text-muted-foreground hover:text-foreground transition-smooth font-alt"
                    >
                      {i.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="pt-8 border-t border-border/40 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">&copy; 2026 Domicilo Labs. All rights reserved.</p>
          <p className="text-xs text-muted-foreground font-alt">Built with pride for Indian property operators.</p>
        </div>
      </div>
    </footer>
  );
};
