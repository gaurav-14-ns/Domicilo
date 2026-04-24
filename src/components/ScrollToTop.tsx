import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/** Resets scroll to top on every route change (ignores hash links). */
export const ScrollToTop = () => {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) return; // let anchor scroll happen naturally
    window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
  }, [pathname, hash]);
  return null;
};
