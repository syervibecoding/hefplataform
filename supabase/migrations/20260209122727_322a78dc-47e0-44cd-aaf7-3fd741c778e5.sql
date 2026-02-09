
-- Add new columns
ALTER TABLE public.clients ADD COLUMN dias_certidoes integer[] DEFAULT '{}'::integer[];
ALTER TABLE public.clients ADD COLUMN dias_caixas_postais integer[] DEFAULT '{}'::integer[];

-- Migrate existing data
UPDATE public.clients SET dias_certidoes = dias_execucao, dias_caixas_postais = dias_execucao WHERE dias_execucao IS NOT NULL AND dias_execucao != '{}';

-- Drop old column
ALTER TABLE public.clients DROP COLUMN dias_execucao;
