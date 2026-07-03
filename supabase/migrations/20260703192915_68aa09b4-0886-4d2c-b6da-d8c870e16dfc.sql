
-- Snapshot mensal por origem (cliente/despesa) para congelar meses passados
CREATE TABLE public.cash_month_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ano INT NOT NULL,
  mes INT NOT NULL, -- 0..11
  origem_tipo TEXT NOT NULL, -- 'cliente' | 'despesa'
  origem_id UUID NOT NULL,
  sub_kind TEXT NOT NULL DEFAULT 'default', -- 'default' | 'mensalidade' | 'implementacao'
  tipo TEXT NOT NULL, -- 'receita' | 'despesa'
  nome TEXT NOT NULL,
  categoria TEXT,
  valor NUMERIC NOT NULL DEFAULT 0,
  dia_pagamento INT,
  data DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (ano, mes, origem_tipo, origem_id, sub_kind)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cash_month_snapshots TO authenticated;
GRANT ALL ON public.cash_month_snapshots TO service_role;
ALTER TABLE public.cash_month_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage cash_month_snapshots"
  ON public.cash_month_snapshots FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE INDEX cash_month_snapshots_ano_mes_idx ON public.cash_month_snapshots (ano, mes);

-- Histórico de alíquota de imposto (vigência por mês)
CREATE TABLE public.tax_rate_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vigente_desde DATE NOT NULL UNIQUE, -- sempre dia 1 do mês
  aliquota NUMERIC NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tax_rate_history TO authenticated;
GRANT ALL ON public.tax_rate_history TO service_role;
ALTER TABLE public.tax_rate_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage tax_rate_history"
  ON public.tax_rate_history FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Seed: registra alíquota atual (financial_settings.tax_rate ou 6) como vigência inicial
INSERT INTO public.tax_rate_history (vigente_desde, aliquota)
SELECT DATE '2020-01-01', COALESCE((SELECT value FROM public.financial_settings WHERE key = 'tax_rate' LIMIT 1), 6)
ON CONFLICT (vigente_desde) DO NOTHING;
