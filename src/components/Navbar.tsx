import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Building2, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./ThemeToggle";
import { useAuth, dashboardPathFor } from "@/hooks/useAuth";

const links = [
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
];

export const Navbar = () => {
  const [open, setOpen] = useState(false);
  const nav = useNavigate();
  const { user, role } = useAuth();

  const goDashboard = () => nav(dashboardPathFor(role));
  const goAuth = () => nav("/auth");

  return (
    <header className="fixed top-0 inset-x-0 z-50 backdrop-blur-xl bg-background/70 border-b border-border/60">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-display font-bold text-lg">
          <span className="grid place-items-center h-9 w-9 rounded-xl bg-gradient-primary shadow-glow">
            <Building2 className="h-5 w-5 text-primary-foreground" />
          </span>
          Domicilo
        </Link>
        <nav className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-smooth">
              {l.label}
            </a>
          ))}
        </nav>
        <div className="hidden md:flex items-center gap-2">
          <ThemeToggle />
          {user ? (
            <Button variant="hero" size="sm" onClick={goDashboard}>Open dashboard</Button>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={goAuth}>Sign in</Button>
              <Button variant="hero" size="sm" onClick={goAuth}>Start free</Button>
            </>
          )}
        </div>
        <div className="md:hidden flex items-center gap-1">
          <ThemeToggle />
          <Button variant="ghost" size="icon" onClick={() => setOpen(!open)} aria-label="Menu">
            {open ? <X /> : <Menu />}
          </Button>
        </div>
      </div>
      {open && (
        <div className="md:hidden border-t border-border bg-background/95 backdrop-blur-xl">
          <div className="container py-4 flex flex-col gap-3">
            {links.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="text-sm font-medium py-2">
                {l.label}
              </a>
            ))}
            <div className="flex gap-2 pt-2">
              {user ? (
                <Button variant="hero" size="sm" className="flex-1" onClick={() => { setOpen(false); goDashboard(); }}>Dashboard</Button>
              ) : (
                <>
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => { setOpen(false); goAuth(); }}>Sign in</Button>
                  <Button variant="hero" size="sm" className="flex-1" onClick={() => { setOpen(false); goAuth(); }}>Start free</Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
