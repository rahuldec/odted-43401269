import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Trainee, Level, Status } from "@/lib/trainees";
import { toast } from "sonner";

export function EditTraineeDialog({
  trainee,
  open,
  onOpenChange,
  onSave,
}: {
  trainee: Trainee | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSave: (id: string, patch: Partial<Trainee>) => void;
}) {
  const [form, setForm] = useState<Trainee | null>(trainee);

  useEffect(() => setForm(trainee), [trainee]);

  if (!form) return null;

  function set<K extends keyof Trainee>(k: K, v: Trainee[K]) {
    setForm((p) => (p ? { ...p, [k]: v } : p));
  }

  function submit() {
    if (!form) return;
    onSave(form.id, form);
    toast.success("Trainee updated");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit trainee</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label>Name</Label>
            <Input value={form.name} onChange={(e) => set("name", e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label>Phone</Label>
            <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Join date</Label>
              <Input
                type="date"
                value={form.joinDate}
                onChange={(e) => set("joinDate", e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Date of current level</Label>
              <Input
                type="date"
                value={form.levelSinceDate}
                onChange={(e) => set("levelSinceDate", e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Current level</Label>
              <Select
                value={String(form.currentLevel)}
                onValueChange={(v) => set("currentLevel", Number(v) as Level)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[0, 1, 2, 3].map((l) => (
                    <SelectItem key={l} value={String(l)}>
                      Level {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => set("status", v as Status)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(["Active", "On Hold", "Exited"] as Status[]).map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label>Assigned manager / team</Label>
            <Input value={form.manager} onChange={(e) => set("manager", e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label>Notes</Label>
            <Textarea
              rows={2}
              value={form.notes ?? ""}
              onChange={(e) => set("notes", e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit}>Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
