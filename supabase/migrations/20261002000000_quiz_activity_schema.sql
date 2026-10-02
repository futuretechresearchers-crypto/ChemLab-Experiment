ALTER TABLE public.quizzes
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS category text DEFAULT 'General Chemistry',
  ADD COLUMN IF NOT EXISTS difficulty text DEFAULT 'medium' CHECK (difficulty IN ('easy','medium','hard')),
  ADD COLUMN IF NOT EXISTS time_limit integer CHECK (time_limit IS NULL OR time_limit > 0),
  ADD COLUMN IF NOT EXISTS published boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS share_code text UNIQUE,
  ADD COLUMN IF NOT EXISTS activity_type text DEFAULT 'quiz' CHECK (activity_type IN ('quiz','activity')),
  ADD COLUMN IF NOT EXISTS workspace_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS workspace_config jsonb DEFAULT '{}'::jsonb;

CREATE TABLE IF NOT EXISTS public.quiz_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  question_type text NOT NULL CHECK (question_type IN ('multiple_choice','bond_type','identification','formula_completion')),
  question_text text NOT NULL,
  choices jsonb DEFAULT '[]'::jsonb,
  correct_answer text,
  explanation text,
  hint text,
  question_order integer NOT NULL DEFAULT 1 CHECK (question_order > 0),
  points integer NOT NULL DEFAULT 1 CHECK (points > 0),
  workspace_enabled boolean NOT NULL DEFAULT false,
  workspace_config jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.quiz_attempt_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id uuid NOT NULL REFERENCES public.quiz_attempts(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
  student_answer text,
  is_correct boolean NOT NULL DEFAULT false,
  points_earned integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quizzes_teacher_published ON public.quizzes (teacher_id, published, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quizzes_share_code ON public.quizzes (share_code);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz_order ON public.quiz_questions (quiz_id, question_order);
CREATE INDEX IF NOT EXISTS idx_quiz_attempt_answers_attempt ON public.quiz_attempt_answers (attempt_id);

ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempt_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Teachers manage own quizzes" ON public.quizzes
  FOR ALL TO authenticated
  USING (teacher_id = auth.uid())
  WITH CHECK (teacher_id = auth.uid());

CREATE POLICY IF NOT EXISTS "Students read published activities" ON public.quizzes
  FOR SELECT TO authenticated
  USING (published = true);

CREATE POLICY IF NOT EXISTS "Teachers manage own quiz questions" ON public.quiz_questions
  FOR ALL TO authenticated
  USING (
    quiz_id IN (
      SELECT id FROM public.quizzes WHERE teacher_id = auth.uid()
    )
  )
  WITH CHECK (
    quiz_id IN (
      SELECT id FROM public.quizzes WHERE teacher_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "Students read published questions" ON public.quiz_questions
  FOR SELECT TO authenticated
  USING (
    quiz_id IN (
      SELECT id FROM public.quizzes WHERE published = true
    )
  );

CREATE POLICY IF NOT EXISTS "Students read own attempt answers" ON public.quiz_attempt_answers
  FOR SELECT TO authenticated
  USING (
    attempt_id IN (
      SELECT id FROM public.quiz_attempts WHERE student_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "Teachers read quiz answers for their quizzes" ON public.quiz_attempt_answers
  FOR SELECT TO authenticated
  USING (
    question_id IN (
      SELECT q.id FROM public.quiz_questions q
      JOIN public.quizzes z ON z.id = q.quiz_id
      WHERE z.teacher_id = auth.uid()
    )
  );

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_quizzes_updated_at ON public.quizzes;
CREATE TRIGGER set_quizzes_updated_at
BEFORE UPDATE ON public.quizzes
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_quiz_questions_updated_at ON public.quiz_questions;
CREATE TRIGGER set_quiz_questions_updated_at
BEFORE UPDATE ON public.quiz_questions
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
