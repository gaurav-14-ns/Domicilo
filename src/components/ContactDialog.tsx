import { useState, ReactNode } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type Variant = "demo" | "sales" | "video";

const COPY: Record<Variant, { title: string; description: string; submit: string; success: string }> = {
  demo: {
    title: "Book a personalized demo",
    description: "Tell us a bit about your portfolio and we'll reach out within one business day.",
    submit: "Request demo",
    success: "Demo requested",
  },
  sales: {
    title: "Talk to sales",
    description: "Share your needs for the Scale plan and our team will get back to you.",
    submit: "Contact sales",
    success: "Sales request received",
  },
  video: {
    title: "Watch the 2-min demo",
    description: "Drop your email and we'll send the demo video link straight to your inbox.",
    submit: "Send me the link",
    success: "Demo link on its way",
  },
};

interface Props {
  variant: Variant;
  trigger: ReactNode;
  context?: string;
}

export function ContactDialog({ variant, trigger, context }: Props) {
  const copy = COPY[variant];
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [message, setMessage] = useState("");

  const showMessage = variant !== "video";
  const showCompany = variant !== "video";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      toast.error("Name and email are required");
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("leads").insert({
      name: name.trim(),
      email: email.trim(),
      company: company.trim() || null,
      message: [context ? `[${context}]` : "", message.trim()].filter(Boolean).join(" ") || null,
      source: variant,
    });
    setBusy(false);
    if (error) {
      toast.error("Couldn't send", { description: error.message });
      return;
    }
    toast.success(copy.success, {
      description: context ? `Plan: ${context} · ${email}` : email,
    });
    setName(""); setEmail(""); setCompany(""); setMessage("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription>{copy.description}</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cd-name">Name</Label>
            <Input id="cd-name" required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cd-email">Work email</Label>
            <Input id="cd-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          {showCompany && (
            <div className="space-y-2">
              <Label htmlFor="cd-company">Company</Label>
              <Input id="cd-company" value={company} onChange={(e) => setCompany(e.target.value)} />
            </div>
          )}
          {showMessage && (
            <div className="space-y-2">
              <Label htmlFor="cd-message">How can we help?</Label>
              <Textarea id="cd-message" rows={3} value={message} onChange={(e) => setMessage(e.target.value)} />
            </div>
          )}
          <DialogFooter>
            <Button type="submit" variant="hero" disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : copy.submit}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
