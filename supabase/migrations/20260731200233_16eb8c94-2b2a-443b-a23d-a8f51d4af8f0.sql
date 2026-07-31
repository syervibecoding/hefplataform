ALTER TABLE public.investments ADD COLUMN IF NOT EXISTS aliases text[] NOT NULL DEFAULT '{}'::text[];

ALTER TABLE public.investment_transactions ADD COLUMN IF NOT EXISTS import_id uuid REFERENCES public.financial_imports(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS investment_transactions_import_id_idx ON public.investment_transactions(import_id);