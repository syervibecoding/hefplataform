CREATE TABLE public.nav_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_key text NOT NULL UNIQUE,
  label text NOT NULL,
  icon text NOT NULL DEFAULT 'Box',
  position integer NOT NULL DEFAULT 0,
  visible boolean NOT NULL DEFAULT true,
  admin_only boolean NOT NULL DEFAULT false,
  section text NOT NULL DEFAULT 'main',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.nav_items TO authenticated;
GRANT ALL ON public.nav_items TO service_role;
ALTER TABLE public.nav_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "nav_items_select" ON public.nav_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "nav_items_write" ON public.nav_items FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER nav_items_updated_at BEFORE UPDATE ON public.nav_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.client_report_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid NOT NULL UNIQUE REFERENCES public.clients(id) ON DELETE CASCADE,
  titulo text,
  subtitulo text,
  data_referencia date,
  periodo_inicio date,
  periodo_fim date,
  introducao text,
  conclusao text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_report_settings TO authenticated;
GRANT ALL ON public.client_report_settings TO service_role;
ALTER TABLE public.client_report_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "crs_select" ON public.client_report_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "crs_write" ON public.client_report_settings FOR ALL TO authenticated USING (public.is_internal_team()) WITH CHECK (public.is_internal_team());
CREATE TRIGGER crs_updated_at BEFORE UPDATE ON public.client_report_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.client_report_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  item_key text NOT NULL,
  kind text NOT NULL DEFAULT 'timeline',
  titulo text,
  descricao text,
  data date,
  hidden boolean NOT NULL DEFAULT false,
  manual boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (client_id, item_key)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_report_items TO authenticated;
GRANT ALL ON public.client_report_items TO service_role;
ALTER TABLE public.client_report_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cri_select" ON public.client_report_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "cri_write" ON public.client_report_items FOR ALL TO authenticated USING (public.is_internal_team()) WITH CHECK (public.is_internal_team());
CREATE TRIGGER cri_updated_at BEFORE UPDATE ON public.client_report_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();