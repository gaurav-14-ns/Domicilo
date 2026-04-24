import { ReactNode, useState } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { PlayCircle } from "lucide-react";

interface Props { trigger: ReactNode }

export function DemoVideoDialog({ trigger }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Domicilo · 2-min product walkthrough</DialogTitle>
          <DialogDescription>See how owners run buildings, tenants pay rent, and admins oversee it all.</DialogDescription>
        </DialogHeader>
        <div className="aspect-video rounded-xl overflow-hidden border border-border bg-gradient-card relative">
          <div className="absolute inset-0 grid-pattern opacity-30" aria-hidden />
          <div className="absolute inset-0 grid place-items-center">
            <div className="text-center">
              <div className="mx-auto h-20 w-20 rounded-full bg-gradient-primary grid place-items-center shadow-elegant animate-pulse-glow">
                <PlayCircle className="h-10 w-10 text-primary-foreground" />
              </div>
              <div className="mt-4 font-display font-semibold">Live demo recording</div>
              <div className="text-xs text-muted-foreground mt-1">Owner · Tenant · Admin walkthrough</div>
            </div>
          </div>
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>00:12 / 02:00</span>
            <span>1080p · HD</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Prefer a guided walkthrough?{" "}
          <button onClick={() => setOpen(false)} className="text-primary hover:underline">
            Book a personalized demo
          </button>{" "}
          and our team will tailor it to your portfolio.
        </p>
      </DialogContent>
    </Dialog>
  );
}
