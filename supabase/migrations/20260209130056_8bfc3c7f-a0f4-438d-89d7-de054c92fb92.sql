
-- Migrate dias_certidoes and dias_caixas_postais from integer[] to jsonb
-- New format: { "dias": [1,15], "diaSemana": 1, "primeiroDiaUtil": true }

-- Add new jsonb columns
ALTER TABLE public.clients ADD COLUMN agenda_certidoes jsonb DEFAULT '{}';
ALTER TABLE public.clients ADD COLUMN agenda_caixas_postais jsonb DEFAULT '{}';

-- Migrate existing data: convert integer[] to { "dias": [...] }
UPDATE public.clients 
SET agenda_certidoes = jsonb_build_object('dias', COALESCE(dias_certidoes, ARRAY[]::integer[]))
WHERE dias_certidoes IS NOT NULL AND array_length(dias_certidoes, 1) > 0;

UPDATE public.clients 
SET agenda_caixas_postais = jsonb_build_object('dias', COALESCE(dias_caixas_postais, ARRAY[]::integer[]))
WHERE dias_caixas_postais IS NOT NULL AND array_length(dias_caixas_postais, 1) > 0;

-- Drop old columns
ALTER TABLE public.clients DROP COLUMN dias_certidoes;
ALTER TABLE public.clients DROP COLUMN dias_caixas_postais;
