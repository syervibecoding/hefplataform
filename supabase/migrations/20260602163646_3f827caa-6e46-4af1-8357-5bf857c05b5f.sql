CREATE TABLE public.investments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  instituicao TEXT,
  tipo TEXT NOT NULL DEFAULT 'cdb',
  liquidez TEXT NOT NULL DEFAULT 'diaria',
  rendimento_anual NUMERIC NOT NULL DEFAULT 0,
  saldo_inicial NUMERIC NOT NULL DEFAULT 0,
  data_inicial DATE NOT NULL DEFAULT CURRENT_DATE,
  ativo BOOLEAN NOT NULL DEFAULT true,
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.investments TO authenticated;
GRANT ALL ON public.investments TO service_role;

ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage investments" ON public.investments
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_investments_updated_at
  BEFORE UPDATE ON public.investments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.investment_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  investment_id UUID NOT NULL REFERENCES public.investments(id) ON DELETE CASCADE,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  tipo TEXT NOT NULL DEFAULT 'aporte',
  valor NUMERIC NOT NULL DEFAULT 0,
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.investment_transactions TO authenticated;
GRANT ALL ON public.investment_transactions TO service_role;

ALTER TABLE public.investment_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage investment_transactions" ON public.investment_transactions
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_investment_tx_investment ON public.investment_transactions(investment_id, data);