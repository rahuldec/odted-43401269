import { useCallback, useEffect, useState } from "react";
import type { Lesson } from "./modules";

export type LessonProgress = {
  watched: boolean;
  assignmentDone: boolean;
  completedAt?: string;
};

export type ProgressMap = Record<string, Record<string, LessonProgress>>;

const KEY = "odk-progress";

function load(): ProgressMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ProgressMap) : {};
  } catch { return {}; }
}

function save(p: ProgressMap) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(p));
}

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

export function useProgress() {
  const [progress, setProgress] = useState<ProgressMap>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setProgress(load());
    setHydrated(true);
  }, []);

  const persist = useCallback((updater: (p: ProgressMap) => ProgressMap) => {
    setProgress((prev) => {
      const next = updater(prev);
      save(next);
      return next;
    });
  }, []);

  const setLesson = useCallback(
    (traineeId: string, lessonId: string, patch: Partial<LessonProgress>) => {
      persist((p) => {
        const tp = { ...(p[traineeId] || {}) };
        const cur = tp[lessonId] || { watched: false, assignmentDone: false };
        const next = { ...cur, ...patch };
        if (next.watched && !cur.completedAt) next.completedAt = new Date().toISOString();
        tp[lessonId] = next;
        return { ...p, [traineeId]: tp };
      });
    },
    [persist],
  );

  const resetTrainee = useCallback(
    (traineeId: string) => {
      persist((p) => {
        const next = { ...p };
        delete next[traineeId];
        return next;
      });
    },
    [persist],
  );

  return { progress, hydrated, setLesson, resetTrainee };
}
