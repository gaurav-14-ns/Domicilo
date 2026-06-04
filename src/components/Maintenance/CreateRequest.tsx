import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus } from "lucide-react";
import type { MaintenancePriority } from "@/types/maintenance";
import { toast } from "sonner";

type Props = {
  onCreate: (title: string, description: string, priority: MaintenancePriority) => Promise<void>;
};

export function CreateRequest({ onCreate }: Props) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<MaintenancePriority>("medium");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    setBusy(true);
    try {
      await onCreate(title.trim(), description.trim(), priority);
      setTitle("");
      setDescription("");
      setPriority("medium");
      setOpen(false);
    } catch (e) {
      toast.error("Failed to create maintenance request");
      console.error("Create maintenance request failed:", e);
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4 mr-2" /> New request
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-border p-4 space-y-4">
      <div className="space-y-2">
        <Label>Title</Label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Leaking faucet"
          required
        />
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the issue..."
          required
          rows={3}
        />
      </div>
      <div className="flex items-center gap-4">
        <div className="space-y-2">
          <Label>Priority</Label>
          <Select value={priority} onValueChange={(v) => setPriority(v as MaintenancePriority)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2 pt-5">
          <Button type="submit" disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Submit
          </Button>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
        </div>
      </div>
    </form>
  );
}
