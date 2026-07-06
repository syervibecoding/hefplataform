
CREATE TABLE public.client_value_adjustments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  data_inicio DATE NOT NULL,
  novo_valor NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_cva_client_date ON public.client_value_adjustments (client_id, data_inicio);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_value_adjustments TO authenticated;
GRANT ALL ON public.client_value_adjustments TO service_role;
ALTER TABLE public.client_value_adjustments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Internal team can view value adjustments" ON public.client_value_adjustments FOR SELECT TO authenticated USING (public.is_internal_team());
CREATE POLICY "Internal team can insert value adjustments" ON public.client_value_adjustments FOR INSERT TO authenticated WITH CHECK (public.is_internal_team());
CREATE POLICY "Internal team can update value adjustments" ON public.client_value_adjustments FOR UPDATE TO authenticated USING (public.is_internal_team()) WITH CHECK (public.is_internal_team());
CREATE POLICY "Internal team can delete value adjustments" ON public.client_value_adjustments FOR DELETE TO authenticated USING (public.is_internal_team());
CREATE TRIGGER update_client_value_adjustments_updated_at BEFORE UPDATE ON public.client_value_adjustments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
