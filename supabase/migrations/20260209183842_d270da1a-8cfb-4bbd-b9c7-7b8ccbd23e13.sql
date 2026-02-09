
-- Table for dynamic checklist step definitions
CREATE TABLE public.checklist_steps (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo text NOT NULL, -- 'certidoes' or 'caixas_postais'
  label text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.checklist_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read checklist_steps"
  ON public.checklist_steps FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage checklist_steps"
  ON public.checklist_steps FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Seed with current hardcoded steps
INSERT INTO public.checklist_steps (tipo, label, position) VALUES
  ('certidoes', 'Verificar as bases que estamos rodando no código / usar o código correto', 1),
  ('certidoes', 'Rodar a API / automação', 2),
  ('certidoes', 'Verificar quanto foi emitido no mês anterior e se tiver menos, verificar o porquê', 3),
  ('certidoes', 'Fazer o relatório em Excel do que foi emitido e não foi emitido', 4),
  ('certidoes', 'Subir os arquivos para pasta', 5),
  ('certidoes', 'Verificar se todos os arquivos subiram corretamente ou esquecemos de subir/fazer', 6),
  ('caixas_postais', 'Verificar as bases que estamos rodando no código / usar o código correto', 1),
  ('caixas_postais', 'Rodar a API / automação', 2),
  ('caixas_postais', 'Verificar se houve mensagens importantes', 3),
  ('caixas_postais', 'Se houver, enviar para o WhatsApp do cliente e email', 4);
