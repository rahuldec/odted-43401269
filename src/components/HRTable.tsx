import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LEVEL_INFO, daysBetween, nextLevel, type Trainee, type Status } from "@/lib/trainees";
import { ChevronUp, Pencil, Trash2, AlertCircle } from "lucide-react";
import { EditTraineeDialog } from "./EditTraineeDialog";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { completionFor, type ProgressMap } from "@/lib/progress";
import type { Lesson } from "@/lib/modules";

export function HRTable({
  trainees,
  onUpdate,
  onPromote,
  onRemove,
  lessons,
  progress,
}: {
  trainees: Trainee[];
  onUpdate: (id: string, patch: Partial<Trainee>) => void;
  onPromote: (id: string) => void;
  onRemove: (id: string) => void;
  lessons: Lesson[];
  progress: ProgressMap;
}) {
  const [editing, setEditing] = useState<Trainee | null>(null);
  const [deleting, setDeleting] = useState<Trainee | null>(null);

  if (trainees.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center">
        <p className="text-sm text-muted-foreground">
          No trainees yet. Add your first trainee to get started.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Manager</TableHead>
              <TableHead>Level</TableHead>
              <TableHead>Days at level</TableHead>
              <TableHead>Training</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {trainees.map((t) => {
              const days = daysBetween(t.levelSinceDate);
              const overdue = t.status === "Active" && days > 30;
              const nl = nextLevel(t.currentLevel);
              return (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.name}</TableCell>
                  <TableCell className="text-muted-foreground">{t.phone || "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{t.manager || "—"}</TableCell>
                  <TableCell>
                    <span
                      className={`rounded px-2 py-0.5 text-xs font-semibold ${LEVEL_INFO[t.currentLevel].tokenClass}`}
                    >
                      L{t.currentLevel}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span>{days}d</span>
                      {overdue && (
                        <Badge className="gap-1 bg-warning text-warning-foreground hover:bg-warning">
                          <AlertCircle className="h-3 w-3" /> Overdue
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {(() => {
                      const c = completionFor(lessons, progress[t.id]);
                      return (
                        <div className="w-28 space-y-1">
                          <Progress value={c.pct} className="h-1.5" />
                          <div className="text-[11px] text-muted-foreground">
                            {c.done}/{c.total} • {c.pct}%
                          </div>
                        </div>
                      );
                    })()}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={t.status}
                      onValueChange={(v) => onUpdate(t.id, { status: v as Status })}
                    >
                      <SelectTrigger className="h-8 w-[110px]">
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
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={nl === null}
                        onClick={() => {
                          onPromote(t.id);
                          if (nl !== null) toast.success(`${t.name} promoted to Level ${nl}`);
                        }}
                      >
                        <ChevronUp className="mr-1 h-3.5 w-3.5" />
                        Promote
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => setEditing(t)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setDeleting(t)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <EditTraineeDialog
        trainee={editing}
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        onSave={onUpdate}
      />

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete trainee?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove {deleting?.name} from the tracker.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleting) {
                  onRemove(deleting.id);
                  toast.success(`${deleting.name} removed`);
                }
                setDeleting(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
