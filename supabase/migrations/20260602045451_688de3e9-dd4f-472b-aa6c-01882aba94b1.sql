-- =========================================================
-- ENUM + ROLES INFRASTRUCTURE
-- =========================================================
CREATE TYPE public.app_role AS ENUM ('admin', 'trainee');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users read their own roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins read all roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- =========================================================
-- TRAINEES TABLE
-- =========================================================
CREATE TABLE public.trainees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  join_date DATE NOT NULL,
  exit_date DATE,
  current_level SMALLINT NOT NULL DEFAULT 0 CHECK (current_level BETWEEN 0 AND 3),
  level_since_date DATE NOT NULL,
  manager TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active','On Hold','Exited')),
  notes TEXT NOT NULL DEFAULT '',
  username TEXT,
  history JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX trainees_auth_user_idx ON public.trainees(auth_user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.trainees TO authenticated;
GRANT ALL ON public.trainees TO service_role;

ALTER TABLE public.trainees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all trainees"
  ON public.trainees FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Trainee can read own row"
  ON public.trainees FOR SELECT TO authenticated
  USING (auth_user_id = auth.uid());

-- =========================================================
-- LESSON PROGRESS TABLE
-- =========================================================
CREATE TABLE public.lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainee_id UUID NOT NULL REFERENCES public.trainees(id) ON DELETE CASCADE,
  lesson_id TEXT NOT NULL,
  watched BOOLEAN NOT NULL DEFAULT FALSE,
  watch_seconds INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (trainee_id, lesson_id)
);

CREATE INDEX lesson_progress_trainee_idx ON public.lesson_progress(trainee_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.lesson_progress TO authenticated;
GRANT ALL ON public.lesson_progress TO service_role;

ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;

-- Admins can see/manage everyone's progress
CREATE POLICY "Admins manage all progress"
  ON public.lesson_progress FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Trainee can read their own progress rows
CREATE POLICY "Trainee reads own progress"
  ON public.lesson_progress FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.trainees t
    WHERE t.id = lesson_progress.trainee_id AND t.auth_user_id = auth.uid()
  ));

CREATE POLICY "Trainee inserts own progress"
  ON public.lesson_progress FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.trainees t
    WHERE t.id = lesson_progress.trainee_id AND t.auth_user_id = auth.uid()
  ));

CREATE POLICY "Trainee updates own progress"
  ON public.lesson_progress FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.trainees t
    WHERE t.id = lesson_progress.trainee_id AND t.auth_user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.trainees t
    WHERE t.id = lesson_progress.trainee_id AND t.auth_user_id = auth.uid()
  ));

-- =========================================================
-- updated_at trigger
-- =========================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trainees_set_updated_at
  BEFORE UPDATE ON public.trainees
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER lesson_progress_set_updated_at
  BEFORE UPDATE ON public.lesson_progress
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();