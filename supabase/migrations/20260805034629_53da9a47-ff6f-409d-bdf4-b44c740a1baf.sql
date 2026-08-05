ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS valor_bruto_contrato numeric,
  ADD COLUMN IF NOT EXISTS parceria_percentual numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS parceria_parceiro text,
  ADD COLUMN IF NOT EXISTS imposto_descontado numeric NOT NULL DEFAULT 0;