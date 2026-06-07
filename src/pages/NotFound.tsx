import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Crown } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-sunset bg-skyline">
      <div className="text-center max-w-md px-6 animate-fade-up">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 text-primary mb-6">
          <Crown className="h-8 w-8" />
        </div>
        <h1 className="mb-2 font-display text-6xl font-bold text-gradient">404</h1>
        <p className="mb-2 text-lg text-muted-foreground font-alt">This page does not exist in our kingdom.</p>
        <Link to="/" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
          Return to the royal court
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
