
-- 1. dia_pagamento no cliente
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS dia_pagamento integer NOT NULL DEFAULT 5
  CHECK (dia_pagamento BETWEEN 1 AND 31);

-- 2. cash_expenses
CREATE TABLE IF NOT EXISTS public.cash_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  categoria text NOT NULL DEFAULT 'outros',
  valor numeric NOT NULL DEFAULT 0,
  dia_pagamento integer NOT NULL DEFAULT 5 CHECK (dia_pagamento BETWEEN 1 AND 31),
  ultimo_dia_util boolean NOT NULL DEFAULT false,
  recorrencia text NOT NULL DEFAULT 'mensal',
  data_inicio date NOT NULL DEFAULT CURRENT_DATE,
  data_fim date,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.cash_expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage cash_expenses"
  ON public.cash_expenses FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER cash_expenses_updated_at
  BEFORE UPDATE ON public.cash_expenses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. cash_overrides
CREATE TABLE IF NOT EXISTS public.cash_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo text NOT NULL CHECK (tipo IN ('receita','despesa')),
  origem_tipo text CHECK (origem_tipo IN ('cliente','despesa','avulso')),
  origem_id uuid,
  nome text NOT NULL,
  categoria text,
  data date NOT NULL,
  valor numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.cash_overrides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage cash_overrides"
  ON public.cash_overrides FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER cash_overrides_updated_at
  BEFORE UPDATE ON public.cash_overrides
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX IF NOT EXISTS cash_overrides_data_idx ON public.cash_overrides(data);

-- 4. cash_settings (singleton)
CREATE TABLE IF NOT EXISTS public.cash_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  saldo_inicial numeric NOT NULL DEFAULT 0,
  data_saldo_inicial date NOT NULL DEFAULT CURRENT_DATE,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.cash_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage cash_settings"
  ON public.cash_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER cash_settings_updated_at
  BEFORE UPDATE ON public.cash_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- linha única default
INSERT INTO public.cash_settings (saldo_inicial, data_saldo_inicial)
SELECT 0, CURRENT_DATE
WHERE NOT EXISTS (SELECT 1 FROM public.cash_settings);
