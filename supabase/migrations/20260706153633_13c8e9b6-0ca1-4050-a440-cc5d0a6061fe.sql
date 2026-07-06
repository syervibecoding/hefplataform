ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS comissao_percentual numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS comissao_comercial text;