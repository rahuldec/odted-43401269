import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useLessons, groupByModule, type Lesson } from "@/lib/modules";
import { useRole, useTrainees, type Trainee } from "@/lib/trainees";
import { useProgress, isLessonComplete } from "@/lib/progress";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LessonDialog } from "@/components/LessonDialog";
import { CheckCircle2, FileText, PlayCircle, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/modules")({
  head: () => ({ meta: [{ title: "Training Modules — Okie Dokie Solutions" }] }),
  component: ModulesPage,
});

function ModulesPage() {
  const [role] = useRole();
  const { trainees } = useTrainees();
  const { lessons, sync, syncing, syncedAt } = useLessons();
  const { progress, setLesson } = useProgress();
  const [traineeId, setTraineeId] = useState<string>("none");
  const [active, setActive] = useState<Lesson | null>(null);

  const groups = useMemo(() => groupByModule(lessons), [lessons]);
  const trainee: Trainee | null = trainees.find((t) => t.id === traineeId) ?? null;
  const tp = trainee ? progress[trainee.id] : undefined;
  const readOnly = role === "management" || !trainee;

  const totalAssn = lessons.filter((l) => l.assignmentUrl).length;

  return (
    <AppShell>
      <div className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Training Modules</h2>
            <p className="text-sm text-muted-foreground">
              {lessons.length} lessons across {groups.length} modules · {totalAssn} assignments · synced from Google Sheet
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={sync} disabled={syncing}>
              <RefreshCw className={`mr-1 h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`} />
              {syncing ? "Syncing…" : "Sync from Sheet"}
            </Button>
          </div>
        </div>

        {role === "hr" && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Track progress for a trainee</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={traineeId} onValueChange={setTraineeId}>
                <SelectTrigger className="w-full sm:w-[280px]">
                  <SelectValue placeholder="Browse only (no trainee)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Browse only</SelectItem>
                  {trainees
                    .filter((t) => t.currentLevel === 0)
                    .map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name} · {t.manager || "—"}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {syncedAt && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Last synced {new Date(syncedAt).toLocaleString()}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        <Accordion type="multiple" defaultValue={groups.slice(0, 1).map((g) => `m-${g.moduleNo}`)} className="space-y-2">
          {groups.map((g) => {
            const done = g.lessons.filter((l) => isLessonComplete(l, tp?.[l.id])).length;
            return (
              <AccordionItem key={g.moduleNo} value={`m-${g.moduleNo}`} className="rounded-lg border bg-card px-3">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex flex-1 items-center justify-between gap-3 pr-2">
                    <div className="flex items-center gap-3 text-left">
                      <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-xs font-semibold text-primary">
                        {g.moduleNo}
                      </span>
                      <div>
                        <p className="font-medium leading-tight">{g.moduleName}</p>
                        <p className="text-xs text-muted-foreground">{g.lessons.length} lessons</p>
                      </div>
                    </div>
                    {trainee && (
                      <Badge variant={done === g.lessons.length ? "default" : "secondary"} className="shrink-0">
                        {done}/{g.lessons.length}
                      </Badge>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="divide-y border-t">
                    {g.lessons.map((l) => {
                      const lp = tp?.[l.id];
                      const complete = isLessonComplete(l, lp);
                      return (
                        <li key={l.id} className="flex items-center gap-3 py-2.5">
                          <button
                            onClick={() => setActive(l)}
                            className="flex flex-1 items-center gap-2.5 text-left hover:opacity-80"
                          >
                            {complete ? (
                              <CheckCircle2 className="h-4 w-4 shrink-0 text-level-1-foreground" />
                            ) : (
                              <PlayCircle className="h-4 w-4 shrink-0 text-muted-foreground" />
                            )}
                            <span className="text-sm">{l.lessonName}</span>
                          </button>
                          {l.assignmentUrl && (
                            <Badge variant="outline" className="gap-1 text-[10px]">
                              <FileText className="h-3 w-3" /> Assn
                            </Badge>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </div>

      <LessonDialog
        lesson={active}
        trainee={trainee}
        progress={active && trainee ? tp?.[active.id] : undefined}
        readOnly={readOnly}
        onClose={() => setActive(null)}
        onToggleWatched={() => {
          if (!active || !trainee) return;
          setLesson(trainee.id, active.id, { watched: !tp?.[active.id]?.watched });
        }}
        onToggleAssignment={() => {
          if (!active || !trainee) return;
          setLesson(trainee.id, active.id, { assignmentDone: !tp?.[active.id]?.assignmentDone });
        }}
      />
    </AppShell>
  );
}
