ALTER TABLE public.course_sessions ALTER COLUMN mentor_id DROP NOT NULL;
ALTER TABLE public.course_sessions DROP CONSTRAINT IF EXISTS course_sessions_mentor_id_fkey;
ALTER TABLE public.course_sessions
  ADD CONSTRAINT course_sessions_mentor_id_fkey
  FOREIGN KEY (mentor_id) REFERENCES public.profiles(id) ON DELETE SET NULL;