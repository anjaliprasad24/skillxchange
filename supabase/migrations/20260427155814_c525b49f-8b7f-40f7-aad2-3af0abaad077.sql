
-- ============================================================
-- SkillXchange schema (adapted from user's MySQL design)
-- ============================================================

-- Enums
CREATE TYPE public.skill_level AS ENUM ('Beginner','Intermediate','Advanced');
CREATE TYPE public.session_mode AS ENUM ('Online','Offline');
CREATE TYPE public.enrollment_status AS ENUM ('Active','Completed','Dropped');
CREATE TYPE public.attendance_status AS ENUM ('Present','Absent');
CREATE TYPE public.day_of_week AS ENUM ('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday');
CREATE TYPE public.txn_type AS ENUM ('Credit','Debit');
CREATE TYPE public.request_status AS ENUM ('Pending','Accepted','Rejected');
CREATE TYPE public.app_role AS ENUM ('admin','moderator','user');

-- ============================================================
-- profiles (replaces user table; FK to auth.users, NOT a FK ref)
-- ============================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT UNIQUE,
  email TEXT NOT NULL UNIQUE,
  credits INT NOT NULL DEFAULT 100,
  reputation NUMERIC(3,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- user_roles (separate from profiles to avoid privilege escalation)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- has_role security definer function
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

-- ============================================================
-- Reference / catalog tables
-- ============================================================
CREATE TABLE public.skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  address TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.level_credit_policy (
  level public.skill_level PRIMARY KEY,
  credits_per_session INT NOT NULL CHECK (credits_per_session > 0)
);

-- ============================================================
-- User <-> Skill bridges
-- ============================================================
CREATE TABLE public.user_skills_teach (
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  level public.skill_level NOT NULL,
  PRIMARY KEY (user_id, skill_id)
);

CREATE TABLE public.user_skills_learn (
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, skill_id)
);

-- ============================================================
-- Courses & sessions
-- ============================================================
CREATE TABLE public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  credit_cost INT NOT NULL CHECK (credit_cost > 0),
  skill_id UUID REFERENCES public.skills(id) ON DELETE SET NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.course_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  mentor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  mode public.session_mode NOT NULL,
  slots INT NOT NULL CHECK (slots >= 0),
  location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.course_sessions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  enroll_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status public.enrollment_status NOT NULL DEFAULT 'Active',
  UNIQUE (session_id, student_id)
);

CREATE TABLE public.group_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.course_sessions(id) ON DELETE CASCADE,
  session_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL
);

CREATE TABLE public.session_attendance (
  group_session_id UUID NOT NULL REFERENCES public.group_sessions(id) ON DELETE CASCADE,
  enrollment_id UUID NOT NULL REFERENCES public.enrollments(id) ON DELETE CASCADE,
  status public.attendance_status NOT NULL,
  PRIMARY KEY (group_session_id, enrollment_id)
);

CREATE TABLE public.completions (
  enrollment_id UUID PRIMARY KEY REFERENCES public.enrollments(id) ON DELETE CASCADE,
  completion_date DATE NOT NULL DEFAULT CURRENT_DATE,
  proof TEXT
);

CREATE TABLE public.rating_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES public.enrollments(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  feedback TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.user_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  day_of_week public.day_of_week NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL
);

-- ============================================================
-- Credits, notifications, requests
-- ============================================================
CREATE TABLE public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount INT NOT NULL,
  type public.txn_type NOT NULL,
  reason TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  message TEXT,
  status public.request_status NOT NULL DEFAULT 'Pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- Events, teams
-- ============================================================
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  mode public.session_mode NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  team_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.team_members (
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  PRIMARY KEY (team_id, user_id)
);

CREATE TABLE public.event_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  registration_date DATE NOT NULL DEFAULT CURRENT_DATE
);

-- ============================================================
-- Auto-create profile on signup (trigger)
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, phone, credits)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    NEW.raw_user_meta_data->>'phone',
    100
  );
  -- Default role
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  -- Welcome credit transaction (audit trail)
  INSERT INTO public.credit_transactions (user_id, amount, type, reason)
  VALUES (NEW.id, 100, 'Credit', 'Welcome bonus');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- updated_at trigger for profiles
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
CREATE TRIGGER profiles_touch BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============================================================
-- Row-Level Security
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.level_credit_policy ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_skills_teach ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_skills_learn ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rating_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

-- profiles: anyone authenticated can view (for browsing mentors); only owner can update
CREATE POLICY "Profiles viewable by authenticated" ON public.profiles
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

-- user_roles: users can read their own; only admins can modify
CREATE POLICY "Users view own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- skills, locations, level_credit_policy: public read, admin write
CREATE POLICY "Skills public read" ON public.skills FOR SELECT USING (true);
CREATE POLICY "Skills admin write" ON public.skills FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated can add skills" ON public.skills FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Locations public read" ON public.locations FOR SELECT USING (true);
CREATE POLICY "Authenticated can add locations" ON public.locations FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Policy public read" ON public.level_credit_policy FOR SELECT USING (true);
CREATE POLICY "Policy admin write" ON public.level_credit_policy FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- user_skills_teach / learn
CREATE POLICY "Teach public read" ON public.user_skills_teach FOR SELECT USING (true);
CREATE POLICY "Teach owner write" ON public.user_skills_teach FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Learn public read" ON public.user_skills_learn FOR SELECT USING (true);
CREATE POLICY "Learn owner write" ON public.user_skills_learn FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- courses: anyone can view, mentor (creator) can manage
CREATE POLICY "Courses public read" ON public.courses FOR SELECT USING (true);
CREATE POLICY "Authenticated create courses" ON public.courses FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Creator updates course" ON public.courses FOR UPDATE TO authenticated
  USING (auth.uid() = created_by);
CREATE POLICY "Creator deletes course" ON public.courses FOR DELETE TO authenticated
  USING (auth.uid() = created_by);

-- course_sessions: public read, mentor manages own
CREATE POLICY "Sessions public read" ON public.course_sessions FOR SELECT USING (true);
CREATE POLICY "Mentor creates sessions" ON public.course_sessions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = mentor_id);
CREATE POLICY "Mentor updates sessions" ON public.course_sessions FOR UPDATE TO authenticated
  USING (auth.uid() = mentor_id);
CREATE POLICY "Mentor deletes sessions" ON public.course_sessions FOR DELETE TO authenticated
  USING (auth.uid() = mentor_id);

-- enrollments: student manages own; mentor of session can view
CREATE POLICY "Student views own enrollments" ON public.enrollments FOR SELECT TO authenticated
  USING (
    auth.uid() = student_id
    OR EXISTS (SELECT 1 FROM public.course_sessions cs WHERE cs.id = session_id AND cs.mentor_id = auth.uid())
  );
CREATE POLICY "Student creates enrollment" ON public.enrollments FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Student updates own enrollment" ON public.enrollments FOR UPDATE TO authenticated
  USING (auth.uid() = student_id);

-- group_sessions: public read, mentor of parent session manages
CREATE POLICY "Group sessions public read" ON public.group_sessions FOR SELECT USING (true);
CREATE POLICY "Mentor manages group sessions" ON public.group_sessions FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.course_sessions cs WHERE cs.id = session_id AND cs.mentor_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.course_sessions cs WHERE cs.id = session_id AND cs.mentor_id = auth.uid()));

-- session_attendance: student & mentor can view; mentor writes
CREATE POLICY "Attendance read" ON public.session_attendance FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.enrollments e
    JOIN public.course_sessions cs ON cs.id = e.session_id
    WHERE e.id = enrollment_id AND (e.student_id = auth.uid() OR cs.mentor_id = auth.uid())
  )
);
CREATE POLICY "Mentor marks attendance" ON public.session_attendance FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.enrollments e
    JOIN public.course_sessions cs ON cs.id = e.session_id
    WHERE e.id = enrollment_id AND cs.mentor_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.enrollments e
    JOIN public.course_sessions cs ON cs.id = e.session_id
    WHERE e.id = enrollment_id AND cs.mentor_id = auth.uid()
  ));

-- completions: student & mentor read; mentor writes
CREATE POLICY "Completions read" ON public.completions FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.enrollments e
    JOIN public.course_sessions cs ON cs.id = e.session_id
    WHERE e.id = enrollment_id AND (e.student_id = auth.uid() OR cs.mentor_id = auth.uid())
  )
);
CREATE POLICY "Mentor writes completion" ON public.completions FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.enrollments e
    JOIN public.course_sessions cs ON cs.id = e.session_id
    WHERE e.id = enrollment_id AND cs.mentor_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.enrollments e
    JOIN public.course_sessions cs ON cs.id = e.session_id
    WHERE e.id = enrollment_id AND cs.mentor_id = auth.uid()
  ));

-- rating_feedback: student writes own (for their enrollment); public read
CREATE POLICY "Feedback public read" ON public.rating_feedback FOR SELECT USING (true);
CREATE POLICY "Student writes feedback" ON public.rating_feedback FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.enrollments e WHERE e.id = enrollment_id AND e.student_id = auth.uid()
  ));

-- user_availability: public read, owner manages
CREATE POLICY "Availability public read" ON public.user_availability FOR SELECT USING (true);
CREATE POLICY "Availability owner write" ON public.user_availability FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- credit_transactions: owner read only; system inserts via triggers/edge fns
CREATE POLICY "Owner reads txns" ON public.credit_transactions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Authenticated inserts own txn" ON public.credit_transactions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- notifications: owner read/update
CREATE POLICY "Owner reads notifs" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Owner updates notifs" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "System inserts notifs" ON public.notifications FOR INSERT TO authenticated WITH CHECK (true);

-- requests: sender + receiver can view; sender creates; receiver updates status
CREATE POLICY "Request parties read" ON public.requests FOR SELECT TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Sender creates request" ON public.requests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Receiver updates request" ON public.requests FOR UPDATE TO authenticated
  USING (auth.uid() = receiver_id);

-- events: public read, admin manages
CREATE POLICY "Events public read" ON public.events FOR SELECT USING (true);
CREATE POLICY "Admins manage events" ON public.events FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- teams: public read, members manage
CREATE POLICY "Teams public read" ON public.teams FOR SELECT USING (true);
CREATE POLICY "Authenticated create teams" ON public.teams FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Team members public read" ON public.team_members FOR SELECT USING (true);
CREATE POLICY "Self join team" ON public.team_members FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Self leave team" ON public.team_members FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Event regs public read" ON public.event_registrations FOR SELECT USING (true);
CREATE POLICY "Team member registers" ON public.event_registrations FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.team_members tm WHERE tm.team_id = event_registrations.team_id AND tm.user_id = auth.uid()));

-- ============================================================
-- Seed reference data
-- ============================================================
INSERT INTO public.level_credit_policy (level, credits_per_session) VALUES
  ('Beginner', 10),
  ('Intermediate', 20),
  ('Advanced', 30);

INSERT INTO public.skills (name) VALUES
  ('Python'),
  ('Web Development'),
  ('Data Structures'),
  ('Machine Learning'),
  ('UI/UX Design'),
  ('Public Speaking'),
  ('Spanish Language'),
  ('Guitar'),
  ('Photography'),
  ('Digital Marketing');

INSERT INTO public.locations (address) VALUES
  ('SRM University, Kattankulathur'),
  ('Online - Google Meet'),
  ('Online - Zoom');
