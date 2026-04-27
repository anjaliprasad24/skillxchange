
-- Fix search_path on touch_updated_at (others already SET search_path)
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- Revoke public/authenticated EXECUTE on internal SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC, anon;
-- has_role is meant to be called by RLS policies under authenticated context, keep authenticated EXECUTE
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO authenticated;

-- Tighten "WITH CHECK (true)" policies
DROP POLICY IF EXISTS "Authenticated can add skills" ON public.skills;
CREATE POLICY "Authenticated can add skills" ON public.skills
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated can add locations" ON public.locations;
CREATE POLICY "Authenticated can add locations" ON public.locations
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "System inserts notifs" ON public.notifications;
CREATE POLICY "Insert notif for self" ON public.notifications
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated create teams" ON public.teams;
CREATE POLICY "Authenticated create teams" ON public.teams
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id));
