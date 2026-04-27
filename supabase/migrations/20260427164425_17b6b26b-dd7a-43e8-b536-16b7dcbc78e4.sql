CREATE OR REPLACE FUNCTION public.complete_session(_enrollment_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid := auth.uid();
  _mentor_id uuid;
  _course_title text;
  _credit_cost int;
  _status enrollment_status;
BEGIN
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT cs.mentor_id, c.credit_cost, c.title, e.status
    INTO _mentor_id, _credit_cost, _course_title, _status
  FROM enrollments e
  JOIN course_sessions cs ON cs.id = e.session_id
  JOIN courses c ON c.id = cs.course_id
  WHERE e.id = _enrollment_id;

  IF _mentor_id IS NULL THEN
    RAISE EXCEPTION 'Enrollment not found';
  END IF;

  IF _mentor_id <> _user_id THEN
    RAISE EXCEPTION 'Only the mentor can mark completion';
  END IF;

  IF _status = 'Completed' THEN
    RAISE EXCEPTION 'Already completed';
  END IF;

  UPDATE enrollments SET status = 'Completed' WHERE id = _enrollment_id;

  INSERT INTO completions (enrollment_id) VALUES (_enrollment_id)
  ON CONFLICT DO NOTHING;

  UPDATE profiles SET credits = credits + _credit_cost WHERE id = _user_id;

  INSERT INTO credit_transactions (user_id, amount, type, reason)
  VALUES (_user_id, _credit_cost, 'Credit', 'Taught: ' || _course_title);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.complete_session(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.complete_session(uuid) TO authenticated;

-- enrollment_id should be unique per completion (one row per enrollment)
ALTER TABLE public.completions
  DROP CONSTRAINT IF EXISTS completions_enrollment_id_unique;
ALTER TABLE public.completions
  ADD CONSTRAINT completions_enrollment_id_unique UNIQUE (enrollment_id);