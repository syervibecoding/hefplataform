
CREATE TABLE public.financial_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.financial_settings TO authenticated;
GRANT ALL ON public.financial_settings TO service_role;
ALTER TABLE public.financial_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin manage financial_settings" ON public.financial_settings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_financial_settings_updated
  BEFORE UPDATE ON public.financial_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.result_allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  percentual numeric NOT NULL DEFAULT 0,
  cor text NOT NULL DEFAULT 'bg-primary',
  ordem int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.result_allocations TO authenticated;
GRANT ALL ON public.result_allocations TO service_role;
ALTER TABLE public.result_allocations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin manage result_allocations" ON public.result_allocations
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_result_allocations_updated
  BEFORE UPDATE ON public.result_allocations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.financial_settings (key, value) VALUES ('tax_rate', 6);

INSERT INTO public.result_allocations (nome, percentual, cor, ordem) VALUES
  ('Reserva / Caixa', 30, 'bg-hef-info', 1),
  ('Capital de Giro', 30, 'bg-primary', 2),
  ('Infraestrutura', 20, 'bg-hef-warning', 3),
  ('Bonificação', 20, 'bg-hef-success', 4);
