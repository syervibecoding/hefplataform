
CREATE TABLE public.client_checklists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('certidoes', 'caixas_postais')),
  periodo TEXT NOT NULL, -- formato: '2026-02'
  steps JSONB NOT NULL DEFAULT '{}'::jsonb, -- { "step_id": true/false }
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(client_id, tipo, periodo)
);

ALTER TABLE public.client_checklists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to client_checklists"
ON public.client_checklists
FOR ALL
USING (true)
WITH CHECK (true);

CREATE TRIGGER update_client_checklists_updated_at
BEFORE UPDATE ON public.client_checklists
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
