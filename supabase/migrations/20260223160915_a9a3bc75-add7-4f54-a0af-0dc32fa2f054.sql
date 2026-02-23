
CREATE TABLE public.crm_stages (
  id text NOT NULL PRIMARY KEY,
  label text NOT NULL,
  color text NOT NULL DEFAULT 'bg-blue-500/15 text-blue-600 border-blue-500/20',
  position integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.crm_stages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read crm_stages" ON public.crm_stages FOR SELECT USING (true);
CREATE POLICY "Admins can manage crm_stages" ON public.crm_stages FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Seed default stages
INSERT INTO public.crm_stages (id, label, color, position) VALUES
  ('novo_lead', 'Lead Identificado', 'bg-blue-500/15 text-blue-600 border-blue-500/20', 0),
  ('contato_feito', 'Contato Feito', 'bg-yellow-500/15 text-yellow-600 border-yellow-500/20', 1),
  ('reuniao_agendada', 'Reunião Agendada', 'bg-purple-500/15 text-purple-600 border-purple-500/20', 2),
  ('proposta_enviada', 'Proposta Enviada', 'bg-orange-500/15 text-orange-600 border-orange-500/20', 3),
  ('negociacao', 'Negociação', 'bg-pink-500/15 text-pink-600 border-pink-500/20', 4),
  ('ganho', 'Convertido', 'bg-green-500/15 text-green-600 border-green-500/20', 5),
  ('perdido', 'Perdido', 'bg-red-500/15 text-red-600 border-red-500/20', 6);
