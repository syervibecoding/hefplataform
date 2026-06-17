
-- Helpers
CREATE OR REPLACE FUNCTION public.get_my_client_id()
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT client_id FROM public.profiles WHERE id = auth.uid() $$;

CREATE OR REPLACE FUNCTION public.client_has_product(_product_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.lovable_product_clients lpc
    WHERE lpc.product_id = _product_id
      AND lpc.client_id = public.get_my_client_id()
  )
$$;

CREATE OR REPLACE FUNCTION public.is_internal_team()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(),'admin')
      OR public.has_role(auth.uid(),'coordenador')
      OR public.has_role(auth.uid(),'user')
$$;

-- ===== support_tickets =====
DROP POLICY IF EXISTS "Authenticated can manage tickets" ON public.support_tickets;

CREATE POLICY "internal team manage tickets" ON public.support_tickets
  FOR ALL TO authenticated
  USING (public.is_internal_team())
  WITH CHECK (public.is_internal_team());

CREATE POLICY "cliente reads own tickets" ON public.support_tickets
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(),'cliente')
    AND client_id = public.get_my_client_id()
  );

CREATE POLICY "cliente opens own tickets" ON public.support_tickets
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(),'cliente')
    AND client_id = public.get_my_client_id()
    AND (product_id IS NULL OR public.client_has_product(product_id))
  );

-- ===== support_ticket_messages =====
DROP POLICY IF EXISTS "Authenticated can manage ticket messages" ON public.support_ticket_messages;

CREATE POLICY "internal team manage ticket messages" ON public.support_ticket_messages
  FOR ALL TO authenticated
  USING (public.is_internal_team())
  WITH CHECK (public.is_internal_team());

CREATE POLICY "cliente reads own ticket messages" ON public.support_ticket_messages
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(),'cliente')
    AND EXISTS (
      SELECT 1 FROM public.support_tickets t
      WHERE t.id = support_ticket_messages.ticket_id
        AND t.client_id = public.get_my_client_id()
    )
  );

CREATE POLICY "cliente posts own ticket messages" ON public.support_ticket_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(),'cliente')
    AND author_type = 'cliente'
    AND EXISTS (
      SELECT 1 FROM public.support_tickets t
      WHERE t.id = support_ticket_messages.ticket_id
        AND t.client_id = public.get_my_client_id()
    )
  );

-- ===== lovable_products =====
DROP POLICY IF EXISTS "Authenticated users can access lovable_products" ON public.lovable_products;

CREATE POLICY "internal team manage lovable_products" ON public.lovable_products
  FOR ALL TO authenticated
  USING (public.is_internal_team())
  WITH CHECK (public.is_internal_team());

CREATE POLICY "cliente reads authorized products" ON public.lovable_products
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(),'cliente')
    AND public.client_has_product(id)
  );

-- ===== lovable_product_clients =====
DROP POLICY IF EXISTS "Authenticated users can access lovable_product_clients" ON public.lovable_product_clients;

CREATE POLICY "internal team manage lovable_product_clients" ON public.lovable_product_clients
  FOR ALL TO authenticated
  USING (public.is_internal_team())
  WITH CHECK (public.is_internal_team());

CREATE POLICY "cliente reads own product links" ON public.lovable_product_clients
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(),'cliente')
    AND client_id = public.get_my_client_id()
  );

-- ===== clients =====
DROP POLICY IF EXISTS "Authenticated users can access clients" ON public.clients;

CREATE POLICY "internal team manage clients" ON public.clients
  FOR ALL TO authenticated
  USING (public.is_internal_team())
  WITH CHECK (public.is_internal_team());

CREATE POLICY "cliente reads own client" ON public.clients
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(),'cliente')
    AND id = public.get_my_client_id()
  );
