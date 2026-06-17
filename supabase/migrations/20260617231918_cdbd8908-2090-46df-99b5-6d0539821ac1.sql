
-- 1) platform_companies
CREATE TABLE IF NOT EXISTS public.platform_companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  email text,
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.platform_companies TO authenticated;
GRANT ALL ON public.platform_companies TO service_role;
ALTER TABLE public.platform_companies ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER platform_companies_updated_at
  BEFORE UPDATE ON public.platform_companies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) platform_company_products
CREATE TABLE IF NOT EXISTS public.platform_company_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.platform_companies(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.lovable_products(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, product_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.platform_company_products TO authenticated;
GRANT ALL ON public.platform_company_products TO service_role;
ALTER TABLE public.platform_company_products ENABLE ROW LEVEL SECURITY;

-- 3) profiles.platform_company_id
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS platform_company_id uuid REFERENCES public.platform_companies(id) ON DELETE SET NULL;

-- 4) support_tickets.platform_company_id
ALTER TABLE public.support_tickets
  ADD COLUMN IF NOT EXISTS platform_company_id uuid REFERENCES public.platform_companies(id) ON DELETE SET NULL,
  ALTER COLUMN client_id DROP NOT NULL;

-- 5) Helper functions
CREATE OR REPLACE FUNCTION public.get_my_platform_company_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT platform_company_id FROM public.profiles WHERE id = auth.uid() $$;

CREATE OR REPLACE FUNCTION public.client_has_product(_product_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.platform_company_products pcp
    WHERE pcp.product_id = _product_id
      AND pcp.company_id = public.get_my_platform_company_id()
  )
$$;

-- 6) Policies on platform_companies
DROP POLICY IF EXISTS "internal team manage platform_companies" ON public.platform_companies;
CREATE POLICY "internal team manage platform_companies" ON public.platform_companies
  FOR ALL TO authenticated
  USING (public.is_internal_team())
  WITH CHECK (public.is_internal_team());

DROP POLICY IF EXISTS "cliente reads own platform company" ON public.platform_companies;
CREATE POLICY "cliente reads own platform company" ON public.platform_companies
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(),'cliente')
    AND id = public.get_my_platform_company_id()
  );

-- 7) Policies on platform_company_products
DROP POLICY IF EXISTS "internal team manage company products" ON public.platform_company_products;
CREATE POLICY "internal team manage company products" ON public.platform_company_products
  FOR ALL TO authenticated
  USING (public.is_internal_team())
  WITH CHECK (public.is_internal_team());

DROP POLICY IF EXISTS "cliente reads own company products" ON public.platform_company_products;
CREATE POLICY "cliente reads own company products" ON public.platform_company_products
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(),'cliente')
    AND company_id = public.get_my_platform_company_id()
  );

-- 8) Update support_tickets policies for cliente to use platform_company_id
DROP POLICY IF EXISTS "cliente reads own tickets" ON public.support_tickets;
CREATE POLICY "cliente reads own tickets" ON public.support_tickets
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(),'cliente')
    AND platform_company_id = public.get_my_platform_company_id()
  );

DROP POLICY IF EXISTS "cliente opens own tickets" ON public.support_tickets;
CREATE POLICY "cliente opens own tickets" ON public.support_tickets
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(),'cliente')
    AND platform_company_id = public.get_my_platform_company_id()
    AND (product_id IS NULL OR public.client_has_product(product_id))
  );

-- 9) ticket messages policies — use platform_company_id link
DROP POLICY IF EXISTS "cliente reads own ticket messages" ON public.support_ticket_messages;
CREATE POLICY "cliente reads own ticket messages" ON public.support_ticket_messages
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(),'cliente')
    AND EXISTS (
      SELECT 1 FROM public.support_tickets t
      WHERE t.id = support_ticket_messages.ticket_id
        AND t.platform_company_id = public.get_my_platform_company_id()
    )
  );

DROP POLICY IF EXISTS "cliente posts own ticket messages" ON public.support_ticket_messages;
CREATE POLICY "cliente posts own ticket messages" ON public.support_ticket_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(),'cliente')
    AND author_type = 'cliente'
    AND EXISTS (
      SELECT 1 FROM public.support_tickets t
      WHERE t.id = support_ticket_messages.ticket_id
        AND t.platform_company_id = public.get_my_platform_company_id()
    )
  );

-- 10) Drop now-unused cliente policies on legacy tables
DROP POLICY IF EXISTS "cliente reads own client" ON public.clients;
DROP POLICY IF EXISTS "cliente reads own product links" ON public.lovable_product_clients;

-- 11) Enable Realtime for the new tables (best-effort)
ALTER TABLE public.platform_companies REPLICA IDENTITY FULL;
ALTER TABLE public.platform_company_products REPLICA IDENTITY FULL;
DO $$
BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.platform_companies;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.platform_company_products;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;
