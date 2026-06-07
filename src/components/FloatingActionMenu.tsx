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
  const touchStartedInside = useRef(false);

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
    if (animating === "leaving") return;
    setAnimating("leaving");
    setTimeout(() => {
      setOpen(false);
      setAnimating("idle");
    }, 450);
  }, [animating]);

  const handleNav = useCallback((href: string) => {
    closeMenu();
    setTimeout(() => nav(href), 100);
  }, [nav, closeMenu]);

  // Lock body scroll when menu is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Track if touch started inside menu
  useEffect(() => {
    if (!open) return;
    touchStartedInside.current = false;
    const onDown = (e: PointerEvent) => {
      touchStartedInside.current = !!menuRef.current?.contains(e.target as Node);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  // Close on scroll only if touch did NOT start inside menu
  useEffect(() => {
    if (!open) return;
    const onScroll = () => {
      if (!touchStartedInside.current) closeMenu();
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [open, closeMenu]);

  // Close on click outside menu
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        const fabBtn = document.querySelector("[data-fab-toggle]");
        if (fabBtn?.contains(e.target as Node)) return;
        closeMenu();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open, closeMenu]);

  return (
    <>
      {/* Glass overlay when menu is open */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden bg-black/30 backdrop-blur-sm" />
      )}
      <div
        className={`fixed bottom-6 z-50 flex flex-col items-end gap-3 md:hidden ${
          position === "right" ? "right-6" : "left-6"
        }`}
        style={{ position: "fixed" }}
      >
        {open && (
          <div
            ref={menuRef}
            className={`mb-2 min-w-[240px] rounded-2xl border border-primary/20 shadow-elegant overflow-hidden ${
              animating === "entering" ? "animate-fab-in" : animating === "leaving" ? "animate-fab-out" : ""
            }`}
            style={{
              background: "hsl(240 60% 8% / 0.85)",
              backdropFilter: "blur(32px) saturate(1.4)",
              WebkitBackdropFilter: "blur(32px) saturate(1.4)",
              boxShadow: "0 0 60px hsl(45 65% 52% / 0.08), 0 8px 32px hsl(0 0% 0% / 0.4), inset 0 1px 0 hsl(45 65% 52% / 0.1)",
            }}
          >
            {/* Top gold accent bar */}
            <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-primary to-transparent opacity-60" />

            <div className="p-2">
              {menuItems.map((item, i) => {
                const active = loc.pathname === item.href;
                return (
                  <button
                    key={item.href}
                    onClick={() => handleNav(item.href)}
                    style={{ animationDelay: `${i * 70}ms` }}
                    className={`group flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-medium transition-all duration-300 ${
                      animating === "entering" ? "animate-fab-item-in" : ""
                    } ${
                      active
                        ? "bg-primary/15 text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    } hover:bg-white/5 hover:shadow-[0_0_25px_hsl(45_65%_52%/0.15)] hover:scale-[1.02] hover:border hover:border-primary/10`}
                  >
                    <item.icon className={`h-4 w-4 transition-all duration-300 group-hover:scale-110 group-hover:drop-shadow-[0_0_8px_hsl(45_65%_52%/0.5)] ${
                      active ? "text-primary" : "text-muted-foreground group-hover:text-primary"
                    }`} />
                    <span className="flex-1 text-left tracking-wide">{item.label}</span>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 transition-all duration-300 group-hover:translate-x-1 group-hover:text-primary/60" />
                  </button>
                );
              })}

              {/* Divider with gold shimmer */}
              <div className="my-1 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

              {user ? (
                <button
                  onClick={() => { closeMenu(); setTimeout(() => nav(dashboardPathFor(role)), 100); }}
                  style={{ animationDelay: `${menuItems.length * 70}ms` }}
                  className={`group flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-medium transition-all duration-300 ${
                    animating === "entering" ? "animate-fab-item-in" : ""
                  } text-primary hover:bg-white/5 hover:shadow-[0_0_25px_hsl(45_65%_52%/0.15)] hover:scale-[1.02] hover:border hover:border-primary/10`}
                >
                  <Crown className="h-4 w-4 transition-all duration-300 group-hover:scale-110 group-hover:drop-shadow-[0_0_8px_hsl(45_65%_52%/0.5)]" />
                  <span className="flex-1 text-left tracking-wide">Dashboard</span>
                  <ChevronRight className="h-3.5 w-3.5 text-primary/40 transition-all duration-300 group-hover:translate-x-1 group-hover:text-primary/60" />
                </button>
              ) : (
                <>
                  <button
                    onClick={() => handleNav("/auth")}
                    style={{ animationDelay: `${menuItems.length * 70}ms` }}
                    className={`group flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-medium transition-all duration-300 ${
                      animating === "entering" ? "animate-fab-item-in" : ""
                    } text-muted-foreground hover:text-foreground hover:bg-white/5 hover:shadow-[0_0_25px_hsl(45_65%_52%/0.15)] hover:scale-[1.02] hover:border hover:border-primary/10`}
                  >
                    <Sparkles className="h-4 w-4 transition-all duration-300 group-hover:scale-110 group-hover:drop-shadow-[0_0_8px_hsl(45_65%_52%/0.5)]" />
                    <span className="flex-1 text-left tracking-wide">Sign in</span>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 transition-all duration-300 group-hover:translate-x-1 group-hover:text-primary/60" />
                  </button>
                  <button
                    onClick={() => handleNav("/auth")}
                    style={{ animationDelay: `${(menuItems.length + 1) * 70}ms` }}
                    className={`group flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-medium transition-all duration-300 ${
                      animating === "entering" ? "animate-fab-item-in" : ""
                    } text-primary hover:bg-white/5 hover:shadow-[0_0_25px_hsl(45_65%_52%/0.15)] hover:scale-[1.02] hover:border hover:border-primary/10`}
                  >
                    <Crown className="h-4 w-4 transition-all duration-300 group-hover:scale-110 group-hover:drop-shadow-[0_0_8px_hsl(45_65%_52%/0.5)]" />
                    <span className="flex-1 text-left tracking-wide">Start free trial</span>
                    <ChevronRight className="h-3.5 w-3.5 text-primary/40 transition-all duration-300 group-hover:translate-x-1 group-hover:text-primary/60" />
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        <button
          type="button"
          data-fab-toggle
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onClick={() => (open ? closeMenu() : openMenu())}
          className={`h-14 w-14 rounded-full flex items-center justify-center transition-all duration-500 touch-none select-none ${
            open
              ? "rotate-45 scale-110 shadow-lg bg-primary text-primary-foreground"
              : "hover:scale-110 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-[0_0_30px_hsl(45_65%_52%/0.3),0_4px_15px_hsl(0_0%_0%/0.3)] hover:shadow-[0_0_40px_hsl(45_65%_52%/0.5),0_4px_20px_hsl(0_0%_0%/0.4)]"
          }`}
          aria-label={open ? "Close menu" : "Open menu"}
          style={{ touchAction: "none" }}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>
    </>
  );
}
