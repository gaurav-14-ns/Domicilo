import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth, dashboardPathFor } from "@/hooks/useAuth";

const links = [
  { label: "Browse Properties", href: "/properties" },
  { label: "Features", href: "/#features" },
  { label: "Pricing", href: "/#pricing" },
  { label: "FAQ", href: "/#faq" },
  { label: "About", href: "/about" },
];

export const Navbar = () => {
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

  const isActive = (href: string) => {
    if (href.startsWith("/#")) return false;
    return loc.pathname === href;
  };

  return (
    <header className="fixed top-0 inset-x-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/40">
      <div className="container flex h-16 items-center justify-between">
        <Link
          to="/"
          className="flex items-center gap-3 shrink-0 group"
        >
          <div className="relative">
            <img
              src="/favicon.png"
              alt="Domicilo"
              className="h-11 w-11 rounded-xl object-cover transition-smooth group-hover:shadow-glow"
            />
            <div className="absolute -inset-1 rounded-xl bg-primary/10 opacity-0 group-hover:opacity-100 transition-smooth -z-10" />
          </div>

          <span className="font-display text-xl font-bold tracking-wide">
            Domicilo
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <Link
              key={l.href}
              to={l.href}
              onClick={(e) =>
                handleClick(e, l.href)
              }
              className={`relative text-sm font-medium transition-smooth ${
                isActive(l.href)
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {l.label}
              {isActive(l.href) && (
                <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary rounded-full" />
              )}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <Button
              variant="hero"
              size="sm"
              onClick={goDashboard}
              className="shadow-glow"
            >
              Open dashboard
            </Button>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={goAuth}
              >
                Sign in
              </Button>

              <Button
                variant="hero"
                size="sm"
                onClick={goAuth}
                className="shadow-glow"
              >
                Start free
              </Button>
            </>
          )}
        </div>

      </div>
    </header>
  );
};
