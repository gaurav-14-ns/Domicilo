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
      className="transition-all duration-500 ease-out"
      style={{
        opacity: stage === "done" ? 1 : 0,
        transform: stage === "done" ? "translateY(0)" : "translateY(12px)",
      }}
    >
      {display}
    </div>
  );
}
