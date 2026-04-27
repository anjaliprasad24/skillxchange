REVOKE EXECUTE ON FUNCTION public.enroll_in_session(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.enroll_in_session(uuid) TO authenticated;