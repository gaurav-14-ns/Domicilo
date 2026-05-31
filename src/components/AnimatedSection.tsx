import { useInView } from "@/hooks/useInView";
import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  className?: string;
  delay?: number;
  animation?: "fade-up" | "fade-in-right" | "fade-in" | "scale-in";
  as?: "div" | "section" | "span";
}

const animations: Record<string, string> = {
  "fade-up": "opacity-0 translate-y-8",
  "fade-in-right": "opacity-0 -translate-x-8",
  "fade-in": "opacity-0",
  "scale-in": "opacity-0 scale-95",
};

export function AnimatedSection({
  children,
  className = "",
  delay = 0,
  animation = "fade-up",
  as: Tag = "div",
}: Props) {
  const [ref, inView] = useInView(0.1);

  return (
    <Tag
      ref={ref}
      className={`transition-all duration-700 ease-out ${animations[animation]} ${
        inView ? "!opacity-100 !translate-y-0 !translate-x-0 !scale-100" : ""
      } ${className}`}
      style={{
        transitionDelay: `${delay}ms`,
        willChange: "opacity, transform",
      }}
    >
      {children}
    </Tag>
  );
}

interface StaggerProps {
  children: ReactNode[];
  className?: string;
  itemClassName?: string;
  animation?: "fade-up" | "fade-in-right" | "fade-in" | "scale-in";
  baseDelay?: number;
  staggerMs?: number;
}

export function AnimatedStagger({
  children,
  className = "",
  itemClassName = "",
  animation = "fade-up",
  baseDelay = 0,
  staggerMs = 100,
}: StaggerProps) {
  const [ref, inView] = useInView(0.1);

  return (
    <div ref={ref} className={className}>
      {children.map((child, i) => (
        <div
          key={i}
          className={`transition-all duration-600 ease-out ${
            animations[animation]
          } ${
            inView ? "!opacity-100 !translate-y-0 !translate-x-0 !scale-100" : ""
          } ${itemClassName}`}
          style={{
            transitionDelay: `${baseDelay + i * staggerMs}ms`,
            willChange: "opacity, transform",
          }}
        >
          {child}
        </div>
      ))}
    </div>
  );
}
