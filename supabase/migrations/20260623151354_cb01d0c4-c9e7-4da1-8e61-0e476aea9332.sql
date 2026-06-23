
-- Histórico de importações financeiras
CREATE TABLE public.financial_imports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  kind TEXT NOT NULL CHECK (kind IN ('extrato','fatura')),
  source_name TEXT NOT NULL,
  period_start DATE,
  period_end DATE,
  transactions_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.financial_imports TO authenticated;
GRANT ALL ON public.financial_imports TO service_role;

ALTER TABLE public.financial_imports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage financial_imports"
  ON public.financial_imports
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_financial_imports_updated_at
  BEFORE UPDATE ON public.financial_imports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Ligação dos lançamentos com a importação que os gerou
ALTER TABLE public.cash_overrides
  ADD COLUMN import_id UUID REFERENCES public.financial_imports(id) ON DELETE SET NULL;

CREATE INDEX cash_overrides_import_id_idx ON public.cash_overrides(import_id);
