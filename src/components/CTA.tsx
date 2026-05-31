import { ArrowRight, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ContactDialog } from "./ContactDialog";
import { AnimatedSection } from "./AnimatedSection";

export const CTA = () => {
  const nav = useNavigate();
  return (
    <section className="py-24 relative">
      <div className="absolute top-0 left-0 right-0 divider-royal" aria-hidden />
      <div className="container">
        <AnimatedSection className="relative overflow-hidden rounded-3xl bg-gradient-primary p-10 md:p-16 text-center shadow-elegant">
          <div className="absolute inset-0 pattern-jaali opacity-10" aria-hidden />
          <div className="absolute -top-20 -right-20 h-64 w-64 blur-3xl rounded-full bg-primary-foreground/20" aria-hidden />
          <div className="absolute -bottom-20 -left-20 h-64 w-64 blur-3xl rounded-full bg-primary-foreground/10" aria-hidden />
          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-4 py-1.5 text-xs font-medium text-primary-foreground mb-6 font-alt">
              <Crown className="h-3.5 w-3.5" />
              Start your royal journey today
            </div>
            <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight text-primary-foreground max-w-2xl mx-auto">
              Ready to retire your spreadsheet?
            </h2>
            <p className="mt-4 text-primary-foreground/80 text-lg max-w-xl mx-auto font-alt">
              Join 2,400+ owners running calmer, more profitable properties with Domicilo's royal experience.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <Button variant="glass" size="xl" className="text-primary-foreground border-white/30 hover:bg-white/20 group shadow-glow" onClick={() => nav("/auth")}>
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
        </AnimatedSection>
      </div>
    </section>
  );
};
