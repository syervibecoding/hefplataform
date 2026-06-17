
-- 1) adicionar valor 'cliente' ao enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'cliente';

-- 2) coluna client_id em profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS profiles_client_id_idx ON public.profiles(client_id);

-- 3) permitir que a equipe interna leia perfis (para a tela de Clientes & Acessos)
DROP POLICY IF EXISTS "internal team can read all profiles" ON public.profiles;
CREATE POLICY "internal team can read all profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'coordenador') OR
    public.has_role(auth.uid(), 'user')
  );

-- admin pode atualizar profiles (para definir client_id)
DROP POLICY IF EXISTS "admins can update profiles" ON public.profiles;
CREATE POLICY "admins can update profiles"
  ON public.profiles FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
