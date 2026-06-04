import { useEffect, useState, type ReactNode } from "react";
import { useLocation } from "react-router-dom";

interface Props {
  children: ReactNode;
}

export function PageTransition({ children }: Props) {
  const location = useLocation();
  const [display, setDisplay] = useState<ReactNode>(children);
  const [stage, setStage] = useState<"enter" | "done">("done");

  useEffect(() => {
    setStage("enter");
    const timer = setTimeout(() => {
      setDisplay(children);
      requestAnimationFrame(() => setStage("done"));
    }, 50);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  useEffect(() => {
    setDisplay(children);
  }, [children]);

  return (
    <div
      className="transition-all duration-600 ease-out will-change-transform"
      style={{
        opacity: stage === "done" ? 1 : 0,
        transform: stage === "done" ? "translateY(0) scale(1)" : "translateY(20px) scale(0.98)",
        filter: stage === "done" ? "blur(0)" : "blur(4px)",
        transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      {display}
    </div>
  );
}
