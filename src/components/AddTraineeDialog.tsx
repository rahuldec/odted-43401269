import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { todayISO } from "@/lib/trainees";
import { Plus } from "lucide-react";
import { toast } from "sonner";

export function AddTraineeDialog({
  onAdd,
}: {
  onAdd: (input: {
    name: string;
    phone: string;
    joinDate: string;
    manager: string;
    notes?: string;
    username?: string;
    password?: string;
  }) => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [joinDate, setJoinDate] = useState(todayISO());
  const [manager, setManager] = useState("");
  const [notes, setNotes] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  function reset() {
    setName("");
    setPhone("");
    setJoinDate(todayISO());
    setManager("");
    setNotes("");
    setUsername("");
    setPassword("");
  }

  function submit() {
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (username.trim() && password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    onAdd({ name, phone, joinDate, manager, notes, username, password });
    toast.success(`${name} added at Level 0`);
    reset();
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-1 h-4 w-4" /> Add Trainee
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add new trainee</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="join">Join date</Label>
            <Input
              id="join"
              type="date"
              value={joinDate}
              onChange={(e) => setJoinDate(e.target.value)}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="mgr">Assigned manager / team</Label>
            <Input id="mgr" value={manager} onChange={(e) => setManager(e.target.value)} />
          </div>

          <div className="mt-2 rounded-md border bg-muted/30 p-3 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Trainee portal credentials
            </p>
            <div className="grid gap-1.5">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                placeholder="e.g. ravi.k"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="off"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="text"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              Trainee uses these to sign in to the trainee portal. Leave blank to skip.
            </p>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea id="notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={submit}>Add at Level 0</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
