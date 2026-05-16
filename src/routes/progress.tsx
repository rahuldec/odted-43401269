import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useLessons, groupByModule } from "@/lib/modules";
import { useRole, useTrainees } from "@/lib/trainees";
import { useProgress, completionFor, isLessonComplete } from "@/lib/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
// no checkbox dependency — using native input
import { FileText, RotateCcw } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/progress")({
  head: () => ({ meta: [{ title: "Progress Tracker — Okie Dokie Solutions" }] }),
  component: ProgressPage,
});

function ProgressPage() {
  const [role] = useRole();
  const { trainees } = useTrainees();
  const { lessons } = useLessons();
  const { progress, setLesson, resetTrainee } = useProgress();
  const groups = useMemo(() => groupByModule(lessons), [lessons]);

  const initial = trainees[0]?.id ?? "";
  const [traineeId, setTraineeId] = useState(initial);
  const trainee = trainees.find((t) => t.id === traineeId) ?? trainees[0];
  const tp = trainee ? progress[trainee.id] : undefined;
  const overall = completionFor(lessons, tp);

  if (trainees.length === 0) {
    return (
      <AppShell>
        <EmptyState />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Progress Tracker</h2>
            <p className="text-sm text-muted-foreground">Per-trainee Level 0 video & assignment progress.</p>
          </div>
          <Select value={trainee?.id ?? ""} onValueChange={setTraineeId}>
            <SelectTrigger className="w-full sm:w-[260px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {trainees.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name} · L{t.currentLevel}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {trainee && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base">{trainee.name}</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {trainee.manager || "Unassigned"} · Level {trainee.currentLevel}
                  </p>
                </div>
                {role === "hr" && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      resetTrainee(trainee.id);
                      toast.success("Progress reset");
                    }}
                  >
                    <RotateCcw className="mr-1 h-3.5 w-3.5" /> Reset
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>{overall.done} of {overall.total} lessons complete</span>
                <span className="font-medium">{overall.pct}%</span>
              </div>
              <Progress value={overall.pct} />
            </CardContent>
          </Card>
        )}

        <div className="grid gap-3">
          {trainee &&
            groups.map((g) => {
              const c = completionFor(g.lessons, tp);
              return (
                <Card key={g.moduleNo}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between gap-3">
                      <CardTitle className="text-sm">
                        {g.moduleNo}. {g.moduleName}
                      </CardTitle>
                      <Badge variant={c.pct === 100 ? "default" : "secondary"}>
                        {c.done}/{c.total}
                      </Badge>
                    </div>
                    <Progress value={c.pct} className="h-1.5" />
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {g.lessons.map((l) => {
                        const lp = tp?.[l.id];
                        const complete = isLessonComplete(l, lp);
                        const disabled = role !== "hr";
                        return (
                          <li
                            key={l.id}
                            className="flex flex-wrap items-center gap-3 rounded-md border p-2.5"
                          >
                            <label className="flex flex-1 cursor-pointer items-start gap-2.5">
                              <Checkbox
                                checked={!!lp?.watched}
                                disabled={disabled}
                                onCheckedChange={(v) =>
                                  setLesson(trainee.id, l.id, { watched: !!v })
                                }
                                className="mt-0.5"
                              />
                              <div className="min-w-0">
                                <p className="text-sm leading-snug">{l.lessonName}</p>
                                <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                                  {lp?.completedAt && (
                                    <span>watched {new Date(lp.completedAt).toLocaleDateString()}</span>
                                  )}
                                  {complete && (
                                    <span className="font-medium text-level-1-foreground">complete</span>
                                  )}
                                </div>
                              </div>
                            </label>
                            {l.assignmentUrl && (
                              <div className="flex items-center gap-2">
                                <a
                                  href={l.assignmentUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
                                >
                                  <FileText className="h-3 w-3" /> assignment
                                </a>
                                <label className="flex items-center gap-1.5 text-[11px]">
                                  <Checkbox
                                    checked={!!lp?.assignmentDone}
                                    disabled={disabled}
                                    onCheckedChange={(v) =>
                                      setLesson(trainee.id, l.id, { assignmentDone: !!v })
                                    }
                                  />
                                  done
                                </label>
                              </div>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
        </div>
      </div>
    </AppShell>
  );
}

function EmptyState() {
  return (
    <div className="rounded-lg border border-dashed p-12 text-center">
      <p className="text-sm text-muted-foreground">
        Add a trainee from the Dashboard to start tracking progress.
      </p>
    </div>
  );
}
