import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth, dashboardPathFor } from "@/hooks/useAuth";
import { Crown, X, Home, Sparkles, ChevronRight, Info, MessageSquare, Menu } from "lucide-react";

const menuItems = [
  { label: "Browse Properties", href: "/properties", icon: Home },
  { label: "About", href: "/about", icon: Info },
  { label: "Contact", href: "/contact", icon: MessageSquare },
];

export function FloatingActionMenu() {
  const nav = useNavigate();
  const loc = useLocation();
  const { user, role } = useAuth();
  const [open, setOpen] = useState(false);
  const [animating, setAnimating] = useState<"idle" | "entering" | "leaving">("idle");
  const [position, setPosition] = useState<"left" | "right">("right");
  const dragRef = useRef({ startX: 0, threshold: 0 });
  const menuRef = useRef<HTMLDivElement>(null);

  const isDashboard = loc.pathname.startsWith("/owner") || loc.pathname.startsWith("/tenant") || loc.pathname.startsWith("/admin");
  if (isDashboard) return null;

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    dragRef.current.startX = e.clientX;
    dragRef.current.threshold = 60;
  }, []);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    const dx = e.clientX - dragRef.current.startX;
    if (Math.abs(dx) > dragRef.current.threshold) {
      setPosition(dx < 0 ? "right" : "left");
    }
  }, []);

  const openMenu = useCallback(() => {
    setOpen(true);
    setAnimating("entering");
  }, []);

  const closeMenu = useCallback(() => {
    setAnimating("leaving");
    setTimeout(() => {
      setOpen(false);
      setAnimating("idle");
    }, 220);
  }, []);

  const handleNav = useCallback((href: string) => {
    closeMenu();
    setTimeout(() => nav(href), 50);
  }, [nav, closeMenu]);

  // Close menu on scroll
  useEffect(() => {
    if (!open) return;
    const onScroll = () => closeMenu();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [open, closeMenu]);

  // Close on out-click (click outside the visual menu card)
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        closeMenu();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open, closeMenu]);

  return (
    <div
      className={`fixed bottom-6 z-50 flex flex-col items-end gap-3 md:hidden ${
        position === "right" ? "right-6" : "left-6"
      }`}
      style={{ position: "fixed" }}
    >
      {open && (
        <div
          ref={menuRef}
          className={`mb-2 min-w-[220px] rounded-2xl border border-primary/20 bg-gradient-card p-2 shadow-elegant backdrop-blur-xl glass-card-premium ${
            animating === "entering" ? "animate-fab-in" : animating === "leaving" ? "animate-fab-out" : ""
          }`}
        >
          {menuItems.map((item) => {
            const active = loc.pathname === item.href;
            return (
              <button
                key={item.href}
                onClick={() => handleNav(item.href)}
                className={`group flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300 ${
                  active
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                } hover:shadow-[0_0_20px_hsl(var(--primary)/0.25)] hover:scale-[1.02]`}
              >
                <item.icon className={`h-4 w-4 transition-all duration-300 group-hover:scale-110 ${
                  active ? "text-primary" : "text-muted-foreground group-hover:text-primary"
                }`} />
                <span className="flex-1 text-left">{item.label}</span>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 transition-all duration-300 group-hover:translate-x-0.5" />
              </button>
            );
          })}
          <div className="border-t border-primary/10 my-1" />
          {user ? (
            <button
              onClick={() => { closeMenu(); setTimeout(() => nav(dashboardPathFor(role)), 50); }}
              className="group flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-primary hover:bg-primary/10 transition-all duration-300 hover:shadow-[0_0_20px_hsl(var(--primary)/0.25)] hover:scale-[1.02]"
            >
              <Crown className="h-4 w-4 transition-all duration-300 group-hover:scale-110" />
              <span className="flex-1 text-left">Dashboard</span>
              <ChevronRight className="h-3.5 w-3.5 text-primary/40 transition-all duration-300 group-hover:translate-x-0.5" />
            </button>
          ) : (
            <>
              <button
                onClick={() => handleNav("/auth")}
                className="group flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-300 hover:shadow-[0_0_20px_hsl(var(--primary)/0.25)] hover:scale-[1.02]"
              >
                <Sparkles className="h-4 w-4 transition-all duration-300 group-hover:scale-110" />
                <span className="flex-1 text-left">Sign in</span>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 transition-all duration-300 group-hover:translate-x-0.5" />
              </button>
              <button
                onClick={() => handleNav("/auth")}
                className="group flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-primary hover:bg-primary/10 transition-all duration-300 hover:shadow-[0_0_20px_hsl(var(--primary)/0.25)] hover:scale-[1.02]"
              >
                <Crown className="h-4 w-4 transition-all duration-300 group-hover:scale-110" />
                <span className="flex-1 text-left">Start free trial</span>
                <ChevronRight className="h-3.5 w-3.5 text-primary/40 transition-all duration-300 group-hover:translate-x-0.5" />
              </button>
            </>
          )}
        </div>
      )}

      <button
        type="button"
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onClick={() => (open ? closeMenu() : openMenu())}
        className={`h-14 w-14 rounded-full bg-gradient-primary text-primary-foreground shadow-glow animate-fab-glow flex items-center justify-center transition-all duration-300 ${
          open ? "rotate-45 scale-110 shadow-lg" : "hover:scale-110"
        } touch-none select-none`}
        aria-label={open ? "Close menu" : "Open menu"}
        style={{ touchAction: "none" }}
      >
        {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>
    </div>
  );
}
