
-- Drop all restrictive policies and recreate as permissive

-- clients
DROP POLICY IF EXISTS "Authenticated users can access clients" ON public.clients;
CREATE POLICY "Authenticated users can access clients" ON public.clients
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- client_checklists
DROP POLICY IF EXISTS "Authenticated users can access client_checklists" ON public.client_checklists;
CREATE POLICY "Authenticated users can access client_checklists" ON public.client_checklists
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- melhorias
DROP POLICY IF EXISTS "Authenticated users can access melhorias" ON public.melhorias;
CREATE POLICY "Authenticated users can access melhorias" ON public.melhorias
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- profiles
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
CREATE POLICY "Users can view all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

-- user_roles
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
