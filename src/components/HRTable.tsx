import { useMemo, useState } from "react";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LEVEL_INFO, daysBetween, nextLevel, type Trainee, type Status } from "@/lib/trainees";
import { ChevronUp, Pencil, Trash2, AlertCircle, ListChecks, X } from "lucide-react";
import { EditTraineeDialog } from "./EditTraineeDialog";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { completionFor, isLessonComplete, type LessonProgress, type ProgressMap } from "@/lib/progress";
import { groupByModule, type Lesson } from "@/lib/modules";

export function HRTable({
  trainees,
  onUpdate,
  onPromote,
  onRemove,
  lessons,
  progress,
  onSetLesson,
}: {
  trainees: Trainee[];
  onUpdate: (id: string, patch: Partial<Trainee>) => void;
  onPromote: (id: string) => void;
  onRemove: (id: string) => void;
  lessons: Lesson[];
  progress: ProgressMap;
  onSetLesson: (traineeId: string, lessonId: string, patch: Partial<LessonProgress>) => void;
}) {
  const [editing, setEditing] = useState<Trainee | null>(null);
  const [deleting, setDeleting] = useState<Trainee | null>(null);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [bulkLesson, setBulkLesson] = useState<string>("");

  const selectedIds = useMemo(
    () => trainees.filter((t) => selected[t.id]).map((t) => t.id),
    [trainees, selected],
  );
  const allChecked = trainees.length > 0 && selectedIds.length === trainees.length;
  const someChecked = selectedIds.length > 0 && !allChecked;

  function toggleAll(v: boolean) {
    if (v) {
      const next: Record<string, boolean> = {};
      trainees.forEach((t) => (next[t.id] = true));
      setSelected(next);
    } else setSelected({});
  }

  function bulkMark(action: "watched" | "assignment" | "reset") {
    if (!bulkLesson || selectedIds.length === 0) {
      toast.error("Select trainees and a lesson first");
      return;
    }
    const lesson = lessons.find((l) => l.id === bulkLesson);
    if (!lesson) return;
    selectedIds.forEach((tid) => {
      if (action === "watched") onSetLesson(tid, bulkLesson, { watched: true });
      else if (action === "assignment") onSetLesson(tid, bulkLesson, { assignmentDone: true });
      else onSetLesson(tid, bulkLesson, { watched: false, assignmentDone: false });
    });
    toast.success(
      `${action === "reset" ? "Reset" : "Marked"} "${lesson.lessonName}" for ${selectedIds.length} trainee${selectedIds.length > 1 ? "s" : ""}`,
    );
  }

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
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-muted/40 p-3 backdrop-blur-sm">
          <span className="text-sm font-medium">
            {selectedIds.length} selected
          </span>
          <Select value={bulkLesson} onValueChange={setBulkLesson}>
            <SelectTrigger className="h-9 w-[280px]">
              <SelectValue placeholder="Pick a lesson…" />
            </SelectTrigger>
            <SelectContent className="max-h-[320px]">
              {groupByModule(lessons).map((g) => (
                <div key={g.moduleNo}>
                  <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {g.moduleNo}. {g.moduleName}
                  </div>
                  {g.lessons.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.lessonName}
                    </SelectItem>
                  ))}
                </div>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" onClick={() => bulkMark("watched")}>
            Mark watched
          </Button>
          <Button size="sm" variant="outline" onClick={() => bulkMark("assignment")}>
            Mark assignment done
          </Button>
          <Button size="sm" variant="ghost" onClick={() => bulkMark("reset")}>
            Reset
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="ml-auto"
            onClick={() => setSelected({})}
          >
            <X className="mr-1 h-3.5 w-3.5" /> Clear
          </Button>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={allChecked ? true : someChecked ? "indeterminate" : false}
                  onCheckedChange={(v) => toggleAll(!!v)}
                  aria-label="Select all"
                />
              </TableHead>
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
              const traineeProg = progress[t.id] || {};
              const c = completionFor(lessons, traineeProg);
              return (
                <TableRow key={t.id} data-state={selected[t.id] ? "selected" : undefined}>
                  <TableCell>
                    <Checkbox
                      checked={!!selected[t.id]}
                      onCheckedChange={(v) =>
                        setSelected((s) => ({ ...s, [t.id]: !!v }))
                      }
                      aria-label={`Select ${t.name}`}
                    />
                  </TableCell>
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
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className="w-32 space-y-1 text-left transition hover:opacity-80">
                          <Progress value={c.pct} className="h-1.5" />
                          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                            <ListChecks className="h-3 w-3" />
                            {c.done}/{c.total} • {c.pct}%
                          </div>
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[360px] p-0" align="start">
                        <div className="border-b px-3 py-2">
                          <p className="text-sm font-semibold">{t.name} — lessons</p>
                          <p className="text-xs text-muted-foreground">
                            {c.done}/{c.total} complete • {c.pct}%
                          </p>
                        </div>
                        <ScrollArea className="max-h-[360px]">
                          <div className="space-y-3 p-3">
                            {groupByModule(lessons).map((g) => (
                              <div key={g.moduleNo} className="space-y-1.5">
                                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                  {g.moduleNo}. {g.moduleName}
                                </p>
                                {g.lessons.map((l) => {
                                  const p = traineeProg[l.id];
                                  const done = isLessonComplete(l, p);
                                  return (
                                    <div
                                      key={l.id}
                                      className="flex items-start gap-2 rounded-md border p-2"
                                    >
                                      <div className="flex flex-1 flex-col gap-1.5">
                                        <p
                                          className={`text-xs leading-snug ${done ? "text-muted-foreground line-through" : ""}`}
                                        >
                                          {l.lessonName}
                                        </p>
                                        <div className="flex flex-wrap items-center gap-3 text-[11px]">
                                          <label className="flex items-center gap-1.5">
                                            <Checkbox
                                              checked={!!p?.watched}
                                              onCheckedChange={(v) =>
                                                onSetLesson(t.id, l.id, { watched: !!v })
                                              }
                                            />
                                            Watched
                                          </label>
                                          {l.assignmentUrl && (
                                            <label className="flex items-center gap-1.5">
                                              <Checkbox
                                                checked={!!p?.assignmentDone}
                                                onCheckedChange={(v) =>
                                                  onSetLesson(t.id, l.id, {
                                                    assignmentDone: !!v,
                                                  })
                                                }
                                              />
                                              Assignment
                                            </label>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </PopoverContent>
                    </Popover>
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
