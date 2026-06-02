
-- Restrict checklist_steps SELECT to authenticated users only
DROP POLICY IF EXISTS "Authenticated users can read checklist_steps" ON public.checklist_steps;
CREATE POLICY "Authenticated users can read checklist_steps"
  ON public.checklist_steps FOR SELECT
  TO authenticated
  USING (true);

-- Restrict crm_stages SELECT to authenticated users only
DROP POLICY IF EXISTS "Authenticated users can read crm_stages" ON public.crm_stages;
CREATE POLICY "Authenticated users can read crm_stages"
  ON public.crm_stages FOR SELECT
  TO authenticated
  USING (true);

-- Revoke EXECUTE on SECURITY DEFINER helper functions from anon/public,
-- keeping access only for authenticated users (needed by RLS policies).
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.get_username(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_username(uuid) TO authenticated, service_role;

-- handle_new_user and update_updated_at_column are trigger functions; revoke from public/anon
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
