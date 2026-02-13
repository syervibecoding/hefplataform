
-- Tabela de produtos dinâmicos
CREATE TABLE public.products (
  id text PRIMARY KEY,
  nome text NOT NULL,
  descricao text NOT NULL DEFAULT '',
  icon text NOT NULL DEFAULT 'Box',
  position integer NOT NULL DEFAULT 0,
  config jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read products"
  ON public.products FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage products"
  ON public.products FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Seed dos 4 produtos atuais
INSERT INTO public.products (id, nome, descricao, icon, position) VALUES
  ('hefsys', 'HefSys', 'Contabilidade', 'Calculator', 0),
  ('trafego', 'Tráfego Pago', 'Marketing Digital', 'Megaphone', 1),
  ('automacao', 'Automação IA', 'Automações', 'Bot', 2),
  ('plataformas', 'Plataformas IA', 'Desenvolvimento', 'MonitorSmartphone', 3);

-- Novos campos para automação e plataformas
ALTER TABLE public.clients ADD COLUMN data_golive date DEFAULT NULL;
ALTER TABLE public.clients ADD COLUMN notas_automacao text DEFAULT NULL;
ALTER TABLE public.clients ADD COLUMN nome_plataforma text DEFAULT NULL;
ALTER TABLE public.clients ADD COLUMN tipo_plataforma text DEFAULT NULL;
