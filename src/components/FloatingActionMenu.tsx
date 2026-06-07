import { useState, useRef, useCallback, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
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
  const [position, setPosition] = useState<"left" | "right">("right");
  const dragRef = useRef({ startX: 0, threshold: 0 });

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

  const close = useCallback(() => setOpen(false), []);

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
          onClick={close}
        />
      )}
      <div
        className={`fixed bottom-6 z-50 flex flex-col items-end gap-3 md:hidden ${
          position === "right" ? "right-6" : "left-6"
        }`}
      >
        {open && (
          <div
            className={`mb-2 min-w-[200px] rounded-2xl border border-border/60 bg-gradient-card p-2 shadow-elegant backdrop-blur-xl ${
              position === "right" ? "animate-fade-up origin-bottom-right" : "animate-fade-up origin-bottom-left"
            }`}
            style={{ animationDuration: "0.3s" }}
          >
            {menuItems.map((item) => {
              const active = loc.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={close}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-smooth ${
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  <item.icon className={`h-4 w-4 ${active ? "text-primary" : ""}`} />
                  {item.label}
                  <ChevronRight className="h-3.5 w-3.5 ml-auto text-muted-foreground/40" />
                </Link>
              );
            })}
            <div className="border-t border-border/40 my-1" />
            {user ? (
              <button
                onClick={() => { close(); nav(dashboardPathFor(role)); }}
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-primary hover:bg-primary/10 transition-smooth"
              >
                <Crown className="h-4 w-4" />
                Dashboard
                <ChevronRight className="h-3.5 w-3.5 ml-auto text-muted-foreground/40" />
              </button>
            ) : (
              <>
                <button
                  onClick={() => { close(); nav("/auth"); }}
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-smooth"
                >
                  <Sparkles className="h-4 w-4" />
                  Sign in
                </button>
                <button
                  onClick={() => { close(); nav("/auth"); }}
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-primary hover:bg-primary/10 transition-smooth"
                >
                  <Crown className="h-4 w-4" />
                  Start free trial
                </button>
              </>
            )}
          </div>
        )}

        <button
          type="button"
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onClick={() => setOpen(!open)}
          className={`h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-glow flex items-center justify-center transition-all duration-300 ${
            open ? "rotate-45 scale-110" : "hover:scale-105"
          } touch-none select-none`}
          aria-label={open ? "Close menu" : "Open menu"}
          style={{ touchAction: "none" }}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>
    </>
  );
}
