import { useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, ExternalLink, FileText, Clock } from "lucide-react";
import type { Lesson } from "@/lib/modules";
import { driveEmbed } from "@/lib/modules";
import { formatWatchTime, type LessonProgress } from "@/lib/progress";
import type { Trainee } from "@/lib/trainees";

export function LessonDialog({
  lesson,
  trainee,
  progress,
  readOnly,
  onClose,
  onToggleWatched,
  onToggleAssignment,
  onTick,
}: {
  lesson: Lesson | null;
  trainee?: Trainee | null;
  progress?: LessonProgress;
  readOnly?: boolean;
  onClose: () => void;
  onToggleWatched?: () => void;
  onToggleAssignment?: () => void;
  /** Called every second while the dialog is open with a trainee, to count watch time. */
  onTick?: (seconds: number) => void;
}) {
  // Tick once per second while the lesson dialog is open + has trainee + not read-only.
  const activeRef = useRef(false);
  activeRef.current = !!(lesson && trainee && !readOnly && onTick);

  useEffect(() => {
    if (!lesson || !trainee || readOnly || !onTick) return;
    let lastVisibleTs = Date.now();
    const interval = window.setInterval(() => {
      if (document.visibilityState !== "visible") {
        lastVisibleTs = Date.now();
        return;
      }
      const now = Date.now();
      const delta = Math.min(5, Math.round((now - lastVisibleTs) / 1000));
      lastVisibleTs = now;
      if (delta > 0) onTick(delta);
    }, 1000);
    return () => window.clearInterval(interval);
  }, [lesson?.id, trainee?.id, readOnly, onTick]);

  return (
    <Dialog open={!!lesson} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl">
        {lesson && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Module {lesson.moduleNo} · {lesson.moduleName}</Badge>
                <Badge className="bg-level-0 text-level-0-foreground hover:bg-level-0">Level 0</Badge>
              </div>
              <DialogTitle className="mt-2 text-base sm:text-lg">{lesson.lessonName}</DialogTitle>
              {trainee && (
                <p className="text-xs text-muted-foreground flex items-center gap-3">
                  <span>Tracking for {trainee.name}</span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatWatchTime(progress?.watchSeconds ?? 0)} watched
                  </span>
                </p>
              )}
            </DialogHeader>
            <div className="aspect-video w-full overflow-hidden rounded-md border bg-muted">
              <iframe
                src={driveEmbed(lesson.videoUrl)}
                allow="autoplay; encrypted-media"
                allowFullScreen
                className="h-full w-full"
                title={lesson.lessonName}
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <a
                href={lesson.videoUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                Open in Drive <ExternalLink className="h-3 w-3" />
              </a>
              {trainee && !readOnly && onToggleWatched && (
                <Button size="sm" variant={progress?.watched ? "secondary" : "default"} onClick={onToggleWatched}>
                  <Check className="mr-1 h-4 w-4" />
                  {progress?.watched ? "Watched" : "Mark watched"}
                </Button>
              )}
            </div>
            {lesson.assignmentUrl && (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-muted/40 p-3">
                <a
                  href={lesson.assignmentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-medium hover:underline"
                >
                  <FileText className="h-4 w-4" /> Download assignment
                </a>
                {trainee && !readOnly && onToggleAssignment && (
                  <Button
                    size="sm"
                    variant={progress?.assignmentDone ? "secondary" : "outline"}
                    onClick={onToggleAssignment}
                  >
                    <Check className="mr-1 h-4 w-4" />
                    {progress?.assignmentDone ? "Assignment done" : "Mark done"}
                  </Button>
                )}
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
