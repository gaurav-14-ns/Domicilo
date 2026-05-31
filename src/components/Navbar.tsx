import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./ThemeToggle";
import { useAuth, dashboardPathFor } from "@/hooks/useAuth";

const links = [
  { label: "Features", href: "/#features" },
  { label: "Pricing", href: "/#pricing" },
  { label: "FAQ", href: "/#faq" },
  { label: "About", href: "/about" },
];

export const Navbar = () => {
  const [open, setOpen] = useState(false);

  const nav = useNavigate();

  const loc = useLocation();

  const { user, role } = useAuth();

  const goDashboard = () =>
    nav(dashboardPathFor(role));

  const goAuth = () =>
    nav("/auth");

  const scrollToSection = (
    hash: string
  ) => {
    const el =
      document.getElementById(
        hash
      );

    if (el) {
      const offset = 90;

      const top =
        el.getBoundingClientRect()
          .top +
        window.scrollY -
        offset;

      window.scrollTo({
        top,
        behavior: "smooth",
      });
    }
  };

  const handleClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string
  ) => {
    if (!href.includes("#"))
      return;

    const [path, hash] =
      href.split("#");

    if (
      (path === "/" ||
        path === "") &&
      loc.pathname === "/"
    ) {
      e.preventDefault();

      scrollToSection(hash);
    } else {
      e.preventDefault();

      nav(href);

      requestAnimationFrame(() => {
        scrollToSection(hash);
      });
    }
  };

  return (
    <header className="fixed top-0 inset-x-0 z-50 backdrop-blur-xl bg-background/70 border-b border-border/60">
      <div className="container flex h-16 items-center justify-between">
        <Link
  to="/"
  className="flex items-center gap-3 shrink-0"
>
  <img
    src="/favicon.png"
    alt="Domicilo"
    className="h-12 w-12 rounded-2xl object-cover shadow-glow"
  />

  <span className="text-2xl font-black tracking-tight">
    Domicilo
  </span>
</Link>

        <nav className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <Link
              key={l.href}
              to={l.href}
              onClick={(e) =>
                handleClick(
                  e,
                  l.href
                )
              }
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-smooth"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          <ThemeToggle />

          {user ? (
            <Button
              variant="hero"
              size="sm"
              onClick={
                goDashboard
              }
            >
              Open dashboard
            </Button>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={
                  goAuth
                }
              >
                Sign in
              </Button>

              <Button
                variant="hero"
                size="sm"
                onClick={
                  goAuth
                }
              >
                Start free
              </Button>
            </>
          )}
        </div>

        <div className="md:hidden flex items-center gap-1">
          <ThemeToggle />

          <Button
            variant="ghost"
            size="icon"
            onClick={() =>
              setOpen(!open)
            }
            aria-label="Menu"
          >
            {open ? (
              <X />
            ) : (
              <Menu />
            )}
          </Button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-border bg-background/95 backdrop-blur-xl">
          <div className="container py-4 flex flex-col gap-3">
            {links.map((l) => (
              <Link
                key={l.href}
                to={l.href}
                onClick={(e) => {
                  setOpen(false);

                  handleClick(
                    e,
                    l.href
                  );
                }}
                className="text-sm font-medium py-2"
              >
                {l.label}
              </Link>
            ))}

            <div className="flex gap-2 pt-2">
              {user ? (
                <Button
                  variant="hero"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    setOpen(false);

                    goDashboard();
                  }}
                >
                  Dashboard
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setOpen(false);

                      goAuth();
                    }}
                  >
                    Sign in
                  </Button>

                  <Button
                    variant="hero"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setOpen(false);

                      goAuth();
                    }}
                  >
                    Start free
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
