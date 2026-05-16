import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, ExternalLink, FileText } from "lucide-react";
import type { Lesson } from "@/lib/modules";
import { driveEmbed } from "@/lib/modules";
import type { LessonProgress } from "@/lib/progress";
import type { Trainee } from "@/lib/trainees";

export function LessonDialog({
  lesson,
  trainee,
  progress,
  readOnly,
  onClose,
  onToggleWatched,
  onToggleAssignment,
}: {
  lesson: Lesson | null;
  trainee?: Trainee | null;
  progress?: LessonProgress;
  readOnly?: boolean;
  onClose: () => void;
  onToggleWatched?: () => void;
  onToggleAssignment?: () => void;
}) {
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
                <p className="text-xs text-muted-foreground">Tracking for {trainee.name}</p>
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
