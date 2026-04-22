import { useAuth } from "@/hooks/useAuth";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function Profile() {
  const { user } = useAuth();
  const [phone, setPhone] = useLocalStorage("domicilo:profile:phone", "");
  const [emergency, setEmergency] = useLocalStorage("domicilo:profile:emergency", "");
  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl md:text-3xl font-display font-bold">Profile</h1>
      <form
        onSubmit={(e) => { e.preventDefault(); toast.success("Profile updated"); }}
        className="rounded-xl border border-border bg-gradient-card p-6 space-y-4"
      >
        <div className="space-y-2"><Label>Email</Label><Input value={user?.email ?? ""} disabled /></div>
        <div className="space-y-2"><Label>Phone</Label><Input placeholder="+1 555 0123" value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
        <div className="space-y-2"><Label>Emergency contact</Label><Input placeholder="Name & phone" value={emergency} onChange={(e) => setEmergency(e.target.value)} /></div>
        <Button type="submit" variant="hero">Save</Button>
      </form>
    </div>
  );
}
