import { useState } from "react";
import { useDataStore } from "@/store/DataStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Home, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";

export default function Properties() {
  const { data, addProperty, removeProperty } = useDataStore();
  const list = data.properties;
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [units, setUnits] = useState("10");

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    addProperty({ name, address, units: Number(units) });
    toast.success("Property added", { description: name });
    setName(""); setAddress(""); setUnits("10");
    setOpen(false);
  };

  const remove = (id: string, n: string) => {
    removeProperty(id);
    toast.success("Property removed", { description: n });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold">Properties</h1>
          <p className="text-muted-foreground">Manage every building in your portfolio.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="hero"><Plus className="h-4 w-4" /> Add property</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New property</DialogTitle></DialogHeader>
            <form onSubmit={add} className="space-y-4">
              <div className="space-y-2"><Label>Name</Label><Input required value={name} onChange={(e) => setName(e.target.value)} /></div>
              <div className="space-y-2"><Label>Address</Label><Input required value={address} onChange={(e) => setAddress(e.target.value)} /></div>
              <div className="space-y-2"><Label>Total units</Label><Input type="number" min="1" required value={units} onChange={(e) => setUnits(e.target.value)} /></div>
              <DialogFooter><Button type="submit" variant="hero">Create</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {list.map((p) => (
          <div key={p.id} className="rounded-xl border border-border bg-gradient-card p-5 hover:border-primary/40 transition-smooth">
            <div className="flex items-start justify-between">
              <div className="h-10 w-10 grid place-items-center rounded-lg bg-primary/10 text-primary">
                <Home className="h-5 w-5" />
              </div>
              <Button variant="ghost" size="icon" onClick={() => remove(p.id, p.name)} aria-label="Delete">
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
            <div className="mt-4 font-display font-semibold text-lg">{p.name}</div>
            <div className="text-sm text-muted-foreground">{p.address}</div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-md bg-muted/40 p-2"><div className="text-muted-foreground">Units</div><div className="font-semibold text-base">{p.units}</div></div>
              <div className="rounded-md bg-muted/40 p-2"><div className="text-muted-foreground">Occupied</div><div className="font-semibold text-base">{p.occupied}</div></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
