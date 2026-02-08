
-- Tabela unificada de clientes (todos os produtos)
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id TEXT NOT NULL,
  nome TEXT NOT NULL,
  contato TEXT NOT NULL DEFAULT '',
  whatsapp TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'ativo',
  -- HefSys specific
  cnpjs INTEGER DEFAULT 0,
  consultas TEXT[] DEFAULT '{}',
  frequencia TEXT DEFAULT '1x',
  dias_execucao INTEGER[] DEFAULT '{}',
  faturamento NUMERIC DEFAULT 0,
  custo_api NUMERIC DEFAULT 0,
  -- Generic specific
  valor_contrato NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de melhorias
CREATE TABLE public.melhorias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  prioridade TEXT NOT NULL DEFAULT 'media',
  status TEXT NOT NULL DEFAULT 'backlog',
  tipo TEXT NOT NULL DEFAULT 'melhoria',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.melhorias ENABLE ROW LEVEL SECURITY;

-- Políticas públicas (plataforma interna sem auth por enquanto)
CREATE POLICY "Allow all access to clients" ON public.clients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to melhorias" ON public.melhorias FOR ALL USING (true) WITH CHECK (true);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_melhorias_updated_at
  BEFORE UPDATE ON public.melhorias
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Index para busca por produto
CREATE INDEX idx_clients_product_id ON public.clients(product_id);
