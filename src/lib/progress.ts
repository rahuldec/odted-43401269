import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Lesson } from "./modules";

export type LessonProgress = {
  watched: boolean;
  assignmentDone: boolean;
  completedAt?: string;
  watchSeconds?: number;
};

export type ProgressMap = Record<string, Record<string, LessonProgress>>;

export function isLessonComplete(lesson: Lesson, p?: LessonProgress) {
  if (!p) return false;
  if (!p.watched) return false;
  if (lesson.assignmentUrl && !p.assignmentDone) return false;
  return true;
}

export function completionFor(lessons: Lesson[], traineeProg?: Record<string, LessonProgress>) {
  if (lessons.length === 0) return { done: 0, total: 0, pct: 0 };
  const done = lessons.filter((l) => isLessonComplete(l, traineeProg?.[l.id])).length;
  return { done, total: lessons.length, pct: Math.round((done / lessons.length) * 100) };
}

function rowsToMap(rows: Array<Record<string, unknown>>): ProgressMap {
  const map: ProgressMap = {};
  for (const row of rows) {
    const tid = row.trainee_id as string;
    const lid = row.lesson_id as string;
    (map[tid] ||= {})[lid] = {
      watched: !!row.watched,
      assignmentDone: !!row.assignment_done,
      completedAt: (row.completed_at as string | null) || undefined,
      watchSeconds: (row.watch_seconds as number) || 0,
    };
  }
  return map;
}

export function useProgress() {
  const [progress, setProgress] = useState<ProgressMap>({});
  const [hydrated, setHydrated] = useState(false);
  const progressRef = useRef<ProgressMap>({});
  progressRef.current = progress;

  const refetch = useCallback(async () => {
    const { data, error } = await supabase.from("lesson_progress").select("*");
    if (error) {
      console.error("fetch progress failed", error);
      setProgress({});
    } else {
      setProgress(rowsToMap((data || []) as Array<Record<string, unknown>>));
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    refetch();
    const { data: sub } = supabase.auth.onAuthStateChange(() => refetch());
    return () => sub.subscription.unsubscribe();
  }, [refetch]);

  const writeRow = useCallback(async (traineeId: string, lessonId: string, merged: LessonProgress) => {
    const { error } = await supabase
      .from("lesson_progress")
      .upsert(
        {
          trainee_id: traineeId,
          lesson_id: lessonId,
          watched: !!merged.watched,
          assignment_done: !!merged.assignmentDone,
          watch_seconds: merged.watchSeconds ?? 0,
          completed_at: merged.completedAt ?? null,
        },
        { onConflict: "trainee_id,lesson_id" },
      );
    if (error) console.error("upsert progress failed", error);
  }, []);

  const setLesson = useCallback(
    (traineeId: string, lessonId: string, patch: Partial<LessonProgress>) => {
      const cur = progressRef.current[traineeId]?.[lessonId] || {
        watched: false,
        assignmentDone: false,
        watchSeconds: 0,
      };
      const next: LessonProgress = { ...cur, ...patch };
      if (next.watched && !cur.completedAt) next.completedAt = new Date().toISOString();
      setProgress((p) => {
        const tp = { ...(p[traineeId] || {}) };
        tp[lessonId] = next;
        return { ...p, [traineeId]: tp };
      });
      void writeRow(traineeId, lessonId, next);
    },
    [writeRow],
  );

  const addWatchSeconds = useCallback(
    (traineeId: string, lessonId: string, secs: number) => {
      if (!traineeId || !lessonId || secs <= 0) return;
      const cur = progressRef.current[traineeId]?.[lessonId] || {
        watched: false,
        assignmentDone: false,
        watchSeconds: 0,
      };
      const next: LessonProgress = { ...cur, watchSeconds: (cur.watchSeconds || 0) + secs };
      setProgress((p) => {
        const tp = { ...(p[traineeId] || {}) };
        tp[lessonId] = next;
        return { ...p, [traineeId]: tp };
      });
      void writeRow(traineeId, lessonId, next);
    },
    [writeRow],
  );

  const resetTrainee = useCallback(async (traineeId: string) => {
    setProgress((p) => {
      const next = { ...p };
      delete next[traineeId];
      return next;
    });
    const { error } = await supabase
      .from("lesson_progress")
      .delete()
      .eq("trainee_id", traineeId);
    if (error) console.error("reset progress failed", error);
  }, []);

  return { progress, hydrated, setLesson, addWatchSeconds, resetTrainee };
}

export function totalWatchSeconds(traineeProg?: Record<string, LessonProgress>) {
  if (!traineeProg) return 0;
  return Object.values(traineeProg).reduce((sum, p) => sum + (p.watchSeconds || 0), 0);
}

export function formatWatchTime(seconds: number) {
  if (seconds < 60) return `${seconds}s`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}
