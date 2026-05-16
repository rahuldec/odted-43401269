import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { LEVELS, LEVEL_INFO, daysBetween, type Trainee } from "@/lib/trainees";
import { AlertCircle } from "lucide-react";
import { completionFor, type ProgressMap } from "@/lib/progress";
import type { Lesson } from "@/lib/modules";

function StatusBadge({ status }: { status: Trainee["status"] }) {
  const variant =
    status === "Active" ? "default" : status === "On Hold" ? "secondary" : "destructive";
  return (
    <Badge variant={variant} className="text-[10px]">
      {status}
    </Badge>
  );
}

export function TraineeCard({
  t,
  lessons,
  progress,
}: {
  t: Trainee;
  lessons: Lesson[];
  progress: ProgressMap;
}) {
  const days = daysBetween(t.levelSinceDate);
  const overdue = t.status === "Active" && days > 30;
  const c = completionFor(lessons, progress[t.id]);
  return (
    <Card className="border-l-4" style={{ borderLeftColor: `var(--level-${t.currentLevel})` }}>
      <CardContent className="space-y-2 p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-foreground">{t.name}</div>
            <div className="truncate text-xs text-muted-foreground">{t.manager || "—"}</div>
          </div>
          <StatusBadge status={t.status} />
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Training</span>
            <span>
              {c.done}/{c.total} • {c.pct}%
            </span>
          </div>
          <Progress value={c.pct} className="h-1.5" />
        </div>
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-muted-foreground">{days}d at level</span>
          {overdue && (
            <Badge className="gap-1 bg-warning text-warning-foreground hover:bg-warning">
              <AlertCircle className="h-3 w-3" />
              Overdue review
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function KanbanBoard({
  trainees,
  lessons,
  progress,
}: {
  trainees: Trainee[];
  lessons: Lesson[];
  progress: ProgressMap;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {LEVELS.map((lvl) => {
        const items = trainees.filter((t) => t.currentLevel === lvl);
        const info = LEVEL_INFO[lvl];
        return (
          <div key={lvl} className="flex min-h-[200px] flex-col rounded-lg border bg-muted/30 p-3">
            <div className="mb-3 flex items-center justify-between">
              <span className={`rounded px-2 py-1 text-xs font-semibold ${info.tokenClass}`}>
                {info.name}
              </span>
              <span className="text-xs text-muted-foreground">{items.length}</span>
            </div>
            <div className="space-y-2">
              {items.length === 0 ? (
                <p className="rounded border border-dashed p-4 text-center text-xs text-muted-foreground">
                  No trainees
                </p>
              ) : (
                items.map((t) => (
                  <TraineeCard key={t.id} t={t} lessons={lessons} progress={progress} />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
