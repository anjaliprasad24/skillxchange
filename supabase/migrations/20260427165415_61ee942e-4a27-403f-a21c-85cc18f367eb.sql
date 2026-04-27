-- Function: create notification helper
CREATE OR REPLACE FUNCTION public.notify_user(_user_id uuid, _message text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, message) VALUES (_user_id, _message);
END;
$$;

-- Trigger: when an enrollment is created, notify the student AND the mentor
CREATE OR REPLACE FUNCTION public.on_enrollment_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _course_title text;
  _mentor_id uuid;
  _student_name text;
BEGIN
  SELECT c.title, cs.mentor_id INTO _course_title, _mentor_id
  FROM course_sessions cs JOIN courses c ON c.id = cs.course_id
  WHERE cs.id = NEW.session_id;

  SELECT name INTO _student_name FROM profiles WHERE id = NEW.student_id;

  -- Notify student
  INSERT INTO notifications (user_id, message)
  VALUES (NEW.student_id, 'You enrolled in "' || _course_title || '". See you at the session!');

  -- Notify mentor
  IF _mentor_id IS NOT NULL AND _mentor_id <> NEW.student_id THEN
    INSERT INTO notifications (user_id, message)
    VALUES (_mentor_id, COALESCE(_student_name, 'A learner') || ' joined your course "' || _course_title || '".');
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_on_enrollment_created ON public.enrollments;
CREATE TRIGGER trg_on_enrollment_created
AFTER INSERT ON public.enrollments
FOR EACH ROW EXECUTE FUNCTION public.on_enrollment_created();

-- Trigger: when an enrollment is marked Completed, notify the student
CREATE OR REPLACE FUNCTION public.on_enrollment_completed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _course_title text;
  _credit_cost int;
BEGIN
  IF NEW.status = 'Completed' AND OLD.status <> 'Completed' THEN
    SELECT c.title, c.credit_cost INTO _course_title, _credit_cost
    FROM course_sessions cs JOIN courses c ON c.id = cs.course_id
    WHERE cs.id = NEW.session_id;

    INSERT INTO notifications (user_id, message)
    VALUES (NEW.student_id, 'Your session for "' || _course_title || '" was marked complete. Time to rate it!');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_on_enrollment_completed ON public.enrollments;
CREATE TRIGGER trg_on_enrollment_completed
AFTER UPDATE ON public.enrollments
FOR EACH ROW EXECUTE FUNCTION public.on_enrollment_completed();

-- Function: create_team_and_join (atomic create team + add creator as member)
CREATE OR REPLACE FUNCTION public.create_team_and_join(_event_id uuid, _team_name text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid := auth.uid();
  _team_id uuid;
BEGIN
  IF _user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF NOT EXISTS (SELECT 1 FROM events WHERE id = _event_id) THEN
    RAISE EXCEPTION 'Event not found';
  END IF;

  INSERT INTO teams (event_id, team_name) VALUES (_event_id, _team_name) RETURNING id INTO _team_id;
  INSERT INTO team_members (team_id, user_id) VALUES (_team_id, _user_id);
  RETURN _team_id;
END;
$$;

-- Function: register_team_for_event (only members can register their team)
CREATE OR REPLACE FUNCTION public.register_team_for_event(_team_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid := auth.uid();
  _reg_id uuid;
BEGIN
  IF _user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF NOT EXISTS (SELECT 1 FROM team_members WHERE team_id = _team_id AND user_id = _user_id) THEN
    RAISE EXCEPTION 'Only team members can register the team';
  END IF;
  IF EXISTS (SELECT 1 FROM event_registrations WHERE team_id = _team_id) THEN
    RAISE EXCEPTION 'Team already registered';
  END IF;

  INSERT INTO event_registrations (team_id) VALUES (_team_id) RETURNING id INTO _reg_id;
  RETURN _reg_id;
END;
$$;

-- Realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;