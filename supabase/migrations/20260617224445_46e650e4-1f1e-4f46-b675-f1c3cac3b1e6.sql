
-- 1) links em lovable_products
ALTER TABLE public.lovable_products
  ADD COLUMN IF NOT EXISTS links jsonb NOT NULL DEFAULT '[]'::jsonb;

-- 2) platform_files
CREATE TABLE public.platform_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.lovable_products(id) ON DELETE CASCADE,
  nome text NOT NULL,
  storage_path text NOT NULL,
  size_bytes bigint,
  mime_type text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX platform_files_product_id_idx ON public.platform_files(product_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.platform_files TO authenticated;
GRANT ALL ON public.platform_files TO service_role;

ALTER TABLE public.platform_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "internal team can read platform_files"
  ON public.platform_files FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'coordenador') OR
    public.has_role(auth.uid(), 'user')
  );

CREATE POLICY "internal team can insert platform_files"
  ON public.platform_files FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'coordenador') OR
    public.has_role(auth.uid(), 'user')
  );

CREATE POLICY "internal team can update platform_files"
  ON public.platform_files FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'coordenador') OR
    public.has_role(auth.uid(), 'user')
  );

CREATE POLICY "internal team can delete platform_files"
  ON public.platform_files FOR DELETE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'coordenador') OR
    public.has_role(auth.uid(), 'user')
  );

-- 3) platform_credentials
CREATE TABLE public.platform_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.lovable_products(id) ON DELETE CASCADE,
  label text NOT NULL,
  usuario text,
  senha text,
  notas text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX platform_credentials_product_id_idx ON public.platform_credentials(product_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.platform_credentials TO authenticated;
GRANT ALL ON public.platform_credentials TO service_role;

ALTER TABLE public.platform_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "internal team can read platform_credentials"
  ON public.platform_credentials FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'coordenador') OR
    public.has_role(auth.uid(), 'user')
  );

CREATE POLICY "internal team can insert platform_credentials"
  ON public.platform_credentials FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'coordenador') OR
    public.has_role(auth.uid(), 'user')
  );

CREATE POLICY "internal team can update platform_credentials"
  ON public.platform_credentials FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'coordenador') OR
    public.has_role(auth.uid(), 'user')
  );

CREATE POLICY "internal team can delete platform_credentials"
  ON public.platform_credentials FOR DELETE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'coordenador') OR
    public.has_role(auth.uid(), 'user')
  );

CREATE TRIGGER update_platform_credentials_updated_at
  BEFORE UPDATE ON public.platform_credentials
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
