import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mail, MessageSquare, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export default function Contact() {
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [message, setMessage] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const n = name.trim(), em = email.trim(), msg = message.trim();
    if (!n || !em || !msg) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (n.length < 2 || n.length > 100 || em.length > 255 || msg.length < 5 || msg.length > 2000) {
      toast.error("Please check your input lengths");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) {
      toast.error("Enter a valid email address");
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("leads").insert({
      name: n, email: em,
      company: company.trim() || null, message: msg,
      source: "contact-page",
    });
    setBusy(false);
    if (error) {
      toast.error("Couldn't send", { description: error.message });
      return;
    }
    toast.success("Message sent", { description: "We'll get back to you within one business day." });
    setName(""); setEmail(""); setCompany(""); setMessage("");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-24 pb-16">
        <div className="container max-w-5xl grid md:grid-cols-2 gap-10">
          <div className="space-y-6">
            <h1 className="text-4xl md:text-5xl font-display font-bold">Get in touch</h1>
            <p className="text-muted-foreground text-lg">
              We typically reply within one business day. Tell us a bit about your portfolio
              and what you're trying to solve.
            </p>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <div className="font-semibold">Email</div>
                  <div className="text-sm text-muted-foreground">hello@domicilo.app</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MessageSquare className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <div className="font-semibold">Sales & demos</div>
                  <div className="text-sm text-muted-foreground">Use the form to book a personalized walkthrough.</div>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={submit} className="rounded-2xl border border-border bg-gradient-card p-6 space-y-4 self-start">
            <div className="space-y-2">
              <Label htmlFor="c-name">Name</Label>
              <Input id="c-name" required value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-email">Email</Label>
              <Input id="c-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-company">Company (optional)</Label>
              <Input id="c-company" value={company} onChange={(e) => setCompany(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-msg">Message</Label>
              <Textarea id="c-msg" rows={5} required value={message} onChange={(e) => setMessage(e.target.value)} />
            </div>
            <Button type="submit" variant="hero" className="w-full" disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send message"}
            </Button>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}
