import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ContactDialog } from "./ContactDialog";

export const CTA = () => {
  const nav = useNavigate();
  return (
    <section className="py-24">
      <div className="container">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-primary p-10 md:p-16 text-center shadow-elegant">
          <div className="absolute inset-0 grid-pattern opacity-20" aria-hidden />
          <div className="absolute -top-20 -right-20 h-64 w-64 bg-primary-glow/40 blur-3xl rounded-full" aria-hidden />
          <div className="relative">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-primary-foreground max-w-2xl mx-auto">
              Ready to retire your spreadsheet?
            </h2>
            <p className="mt-4 text-primary-foreground/80 text-lg max-w-xl mx-auto">
              Join 2,400+ owners running calmer, more profitable properties with Domicilo.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <Button variant="glass" size="xl" className="text-primary-foreground border-white/30 hover:bg-white/20 group" onClick={() => nav("/auth")}>
                Start free trial <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
              <ContactDialog
                variant="demo"
                trigger={
                  <Button variant="ghost" size="xl" className="text-primary-foreground hover:bg-white/10">
                    Book a demo
                  </Button>
                }
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
