import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Building2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, dashboardPathFor, AppRole } from "@/hooks/useAuth";
import { detectCurrencyFromBrowser } from "@/lib/currency";

export default function Auth() {
  const nav = useNavigate();
  const { user, role, loading } = useAuth();
  const [busy, setBusy] = useState(false);

  // signup
  const [name, setName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPwd, setSignupPwd] = useState("");
  const [signupRole, setSignupRole] = useState<AppRole>("owner");

  // signin
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");

  useEffect(() => {
    if (!loading && user && role) nav(dashboardPathFor(role), { replace: true });
  }, [user, role, loading, nav]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const detected = detectCurrencyFromBrowser();
      const { error } = await supabase.auth.signUp({
        email: signupEmail,
        password: signupPwd,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: name,
            role: signupRole,
            currency_code: detected.code,
            locale: detected.locale,
          },
        },
      });
      if (error) throw error;
      toast.success("Account created", { description: "Welcome to Domicilo." });
    } catch (err: any) {
      toast.error("Signup failed", { description: err.message });
    } finally {
      setBusy(false);
    }
  };

  const handleSignin = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password: pwd });
      if (error) throw error;
      toast.success("Welcome back");
    } catch (err: any) {
      toast.error("Sign in failed", { description: err.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-hero p-4">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center gap-2 font-display font-bold text-lg justify-center mb-8">
          <span className="grid place-items-center h-10 w-10 rounded-xl bg-gradient-primary shadow-glow">
            <Building2 className="h-5 w-5 text-primary-foreground" />
          </span>
          Domicilo
        </Link>
        <div className="rounded-2xl border border-border bg-background/80 backdrop-blur-xl p-6 shadow-elegant">
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Create account</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignin} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pwd">Password</Label>
                  <Input id="pwd" type="password" required value={pwd} onChange={(e) => setPwd(e.target.value)} />
                </div>
                <Button type="submit" variant="hero" className="w-full" disabled={busy}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign in"}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  You'll be sent to your portal automatically based on your account type.
                </p>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Account type</Label>
                  <RadioGroup
                    value={signupRole}
                    onValueChange={(v) => setSignupRole(v as AppRole)}
                    className="grid grid-cols-2 gap-2"
                  >
                    {(["owner", "tenant"] as AppRole[]).map((r) => (
                      <Label
                        key={r}
                        htmlFor={`su-${r}`}
                        className={`cursor-pointer rounded-lg border px-3 py-2 text-center text-sm capitalize transition-smooth ${
                          signupRole === r ? "border-primary bg-primary/10 text-primary" : "border-border"
                        }`}
                      >
                        <RadioGroupItem value={r} id={`su-${r}`} className="sr-only" />
                        {r === "owner" ? "Property owner" : "Tenant"}
                      </Label>
                    ))}
                  </RadioGroup>
                  <p className="text-[11px] text-muted-foreground">Admin accounts are issued by the platform.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Full name</Label>
                  <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="se">Email</Label>
                  <Input id="se" type="email" required value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sp">Password</Label>
                  <Input id="sp" type="password" required minLength={6} value={signupPwd} onChange={(e) => setSignupPwd(e.target.value)} />
                </div>
                <Button type="submit" variant="hero" className="w-full" disabled={busy}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
