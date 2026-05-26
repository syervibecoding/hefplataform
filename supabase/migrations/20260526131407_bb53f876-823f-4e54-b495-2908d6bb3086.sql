ALTER TABLE public.cash_overrides DROP CONSTRAINT IF EXISTS cash_overrides_tipo_check;
ALTER TABLE public.cash_overrides ADD CONSTRAINT cash_overrides_tipo_check
  CHECK (tipo IN ('receita','despesa','investimento','aporte','retirada'));