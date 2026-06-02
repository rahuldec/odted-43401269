ALTER TABLE public.lesson_progress
  ADD COLUMN assignment_done BOOLEAN NOT NULL DEFAULT FALSE;