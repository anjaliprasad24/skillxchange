CREATE OR REPLACE FUNCTION public.enroll_in_session(_session_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid := auth.uid();
  _course_id uuid;
  _course_title text;
  _credit_cost int;
  _slots int;
  _taken int;
  _balance int;
  _enrollment_id uuid;
BEGIN
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT cs.course_id, cs.slots, c.credit_cost, c.title
    INTO _course_id, _slots, _credit_cost, _course_title
  FROM course_sessions cs
  JOIN courses c ON c.id = cs.course_id
  WHERE cs.id = _session_id;

  IF _course_id IS NULL THEN
    RAISE EXCEPTION 'Session not found';
  END IF;

  IF EXISTS (SELECT 1 FROM enrollments WHERE session_id = _session_id AND student_id = _user_id) THEN
    RAISE EXCEPTION 'Already enrolled in this session';
  END IF;

  SELECT count(*) INTO _taken FROM enrollments WHERE session_id = _session_id AND status = 'Active';
  IF _taken >= _slots THEN
    RAISE EXCEPTION 'Session is full';
  END IF;

  SELECT credits INTO _balance FROM profiles WHERE id = _user_id FOR UPDATE;
  IF _balance < _credit_cost THEN
    RAISE EXCEPTION 'Not enough credits (need %, have %)', _credit_cost, _balance;
  END IF;

  UPDATE profiles SET credits = credits - _credit_cost WHERE id = _user_id;

  INSERT INTO enrollments (session_id, student_id, status)
  VALUES (_session_id, _user_id, 'Active')
  RETURNING id INTO _enrollment_id;

  INSERT INTO credit_transactions (user_id, amount, type, reason)
  VALUES (_user_id, _credit_cost, 'Debit', 'Enrolled in: ' || _course_title);

  RETURN _enrollment_id;
END;
$$;