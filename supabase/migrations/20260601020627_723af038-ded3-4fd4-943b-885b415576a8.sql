CREATE TABLE public.lovable_products (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome text NOT NULL,
  descricao text,
  categoria text,
  status text NOT NULL DEFAULT 'ativo',
  url_app text,
  thumbnail_url text,
  video_demo_url text,
  stack text[] DEFAULT '{}',
  cliente_origem_id uuid,
  tags text[] DEFAULT '{}',
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.lovable_products TO authenticated;
GRANT ALL ON public.lovable_products TO service_role;

ALTER TABLE public.lovable_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can access lovable_products"
ON public.lovable_products FOR ALL TO authenticated
USING (true) WITH CHECK (true);

CREATE TRIGGER update_lovable_products_updated_at
BEFORE UPDATE ON public.lovable_products
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.lovable_product_clients (
  product_id uuid NOT NULL REFERENCES public.lovable_products(id) ON DELETE CASCADE,
  client_id uuid NOT NULL,
  data_replicacao date,
  notas text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (product_id, client_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.lovable_product_clients TO authenticated;
GRANT ALL ON public.lovable_product_clients TO service_role;

ALTER TABLE public.lovable_product_clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can access lovable_product_clients"
ON public.lovable_product_clients FOR ALL TO authenticated
USING (true) WITH CHECK (true);

CREATE INDEX idx_lpc_client ON public.lovable_product_clients(client_id);
CREATE INDEX idx_lpc_product ON public.lovable_product_clients(product_id);