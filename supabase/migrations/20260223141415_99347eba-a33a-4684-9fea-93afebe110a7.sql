
-- Add kickoff date and difficulty level for Automação IA
ALTER TABLE public.clients ADD COLUMN data_kickoff date DEFAULT NULL;
ALTER TABLE public.clients ADD COLUMN nivel_dificuldade text DEFAULT NULL;
